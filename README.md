# ZØYA — E-Commerce Store

متجر إلكتروني كامل لعلامة **ZØYA** (ستريت وير / limited drops)، مبني بـ **Next.js App Router** مع واجهة عميل سريعة ولوحة تحكم داخلية لإدارة الطلبات والمخزون وتحليلات الأرباح.

> مشروع Production-ready: CMS للمحتوى، قاعدة بيانات للطلبات، بريد تلقائي، وتكامل اختياري مع Google Sheets.

---

## نظرة عامة

| الجانب | الوصف |
|--------|--------|
| **الواجهة العامة** | Homepage، كتالوج منتجات، صفحة منتج، سلة، Checkout، تتبع طلب |
| **لوحة التحكم** | `/admin` — طلبات، حالات، خصومات، تنبيهات مخزون، نشرات بريدية |
| **التحليلات** | أرباح وإيرادات حسب فترات (توقيت القاهرة) + أرشيف شهري `/admin/monthly` |
| **المحتوى** | Sanity Studio على `/studio` (منتجات، تصنيفات، شهادات، Reels، شحن) |

---

## الميزات الرئيسية

### واجهة المتجر
- Homepage بأقسام: Hero، Featured Drop، منتجات، Collections أفقية، About، Testimonials، Instagram Reels، Contact
- **Quick View** وبحث منتجات من الـ Navbar
- سلة مشتريات + **Checkout** (عنوان، شحن، كود خصم، **InstaPay** + رفع إثبات دفع)
- صفحة **تتبع الطلب** `/track` (عرض الحالة وتعديل الطلب ضمن القواعد المسموحة)
- وضع **Dark / Light**، Intro animation، صفحات قانونية (`/privacy`, `/terms`, `/cookies`)
- اشتراك Newsletter من الـ Footer مع Rate limiting (Upstash)

### لوحة الإدارة (`/admin`)
- إدارة دورة حياة الطلب: pending → confirmed → shipped → delivered / cancelled
- أكواد خصم (CRUD عبر API)
- تنبيهات **مخزون منخفض** و**مشاكل تجهيز** (fulfillment)
- **Profit Analytics**: فترات نشطة/مغلقة، إغلاق فترة، أرشيف على `/admin/monthly`
- إرسال **Newsletter / Drop emails** (Resend)
- مزامنة الطلبات مع **Google Sheets** (Webhook اختياري)
- حماية بكلمة مرور (`ADMIN_PASS`) — بوابة `/admin-gate` للوصول لـ Admin و Studio

### الأداء (PageSpeed)
- `dynamic()` لـ Swiper والأقسام الثقيلة (Brand، Reels، Social…)
- `LazyInView` لتحميل الأقسام عند الظهور في الشاشة
- صور **AVIF/WebP** عبر `next/image` + `optimizeCss` و `optimizePackageImports`
- Middleware يمرّر `x-zoya-pathname` لتحميل أصول LCP على الصفحة الرئيسية فقط
- خطوط Google مع `font-display: swap`

### حساب الأرباح (Supabase)
معادلة موحدة في `src/app/lib/orderMoney.js` و `profitPeriods.js`:
- **الإيراد:** أسعار المنتجات − الخصومات (بدون الشحن)
- **الربح:** الإيراد − تكلفة المنتجات
- استبعاد الطلبات التي `cost_complete === false`
- كل التواريخ والفترات حسب **توقيت القاهرة** (`cairoTime.js`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js **16** (App Router), React **19** |
| CMS | Sanity v5 (`/studio`) |
| Database | Supabase (PostgreSQL + Storage) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion (dynamic import حيث يلزم) |
| Email | Resend |
| Rate limit | Upstash Redis (`/api/subscribe`) |
| Carousel | Swiper 12 |

---

## هيكل المشروع (مختصر)

```
src/app/          # صفحات وواجهة المتجر + Admin
src/app/api/      # REST routes (orders, discount, newsletter, …)
src/sanity/       # Schemas + GROQ helpers
src/lib/          # Supabase server, Sheets webhook, emails
sql/              # migrations لـ Supabase (profit_periods)
public/images/    # أصول ثابتة (شعار، Hero، noise texture)
scripts/          # optimize-images.mjs
```

---

## التشغيل المحلي

### المتطلبات
- Node.js 20+
- حسابات: **Supabase**, **Sanity**, **Resend** (واختياري: Upstash، Google Sheets Webhook)

### 1. استنساخ وتثبيت

```bash
git clone <repo-url>
cd zoya
npm install
```

### 2. متغيرات البيئة

أنشئ `.env.local` في جذر المشروع:

```env
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_WRITE_TOKEN=

# Admin / Studio
ADMIN_PASS=
STUDIO_PASS=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM=Zoya <hello@example.com>
RESEND_FROM_NEWSLETTER=

# Checkout
NEXT_PUBLIC_INSTAPAY_NUMBER=

# Newsletter rate limit (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: Google Sheets + Supabase DB webhook
GOOGLE_SHEET_WEBHOOK_URL=
SUPABASE_DB_WEBHOOK_SECRET=

# Optional: bundle analysis
# ANALYZE=true
```

> الطلبات وأكواد الخصم والمشتركين تستخدم **Service Role** من السيرفر — لا تعتمد على مفتاح الـ anon في الإنتاج.

### 3. قاعدة البيانات (Supabase)

شغّل مرة واحدة في **SQL Editor**:

```text
sql/profit_periods.sql
```

ينشئ جدول `profit_periods` لفترات الأرباح (نشطة / مغلقة) مع RLS.

جداول أخرى متوقعة في المشروع (أنشئها في Supabase حسب إعدادك): `orders`, `discount_codes`, مشتركي Newsletter، bucket `payment-proofs` للمرفقات.

### 4. Sanity

```bash
npm run dev
```

افتح [http://localhost:3000/studio](http://localhost:3000/studio) وأدخل `STUDIO_PASS` أو `ADMIN_PASS` عند الطلب.

### 5. تشغيل التطبيق

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # بعد build
npm run lint
npm run analyze  # يتطلب ANALYZE=true في البيئة
```

تحسين صور `public/` محلياً (اختياري):

```bash
npm run optimize-images
```

---

## المسارات المهمة

| المسار | الوظيفة |
|--------|---------|
| `/` | الصفحة الرئيسية |
| `/products` | كل المنتجات + فلترة |
| `/product/[id]` | تفاصيل المنتج |
| `/checkout` | إتمام الطلب |
| `/track` | تتبع / تعديل طلب |
| `/admin` | لوحة التحكم |
| `/admin/monthly` | أرشيف الفترات المغلقة |
| `/admin-gate` | اختيار Admin أو Studio |
| `/studio` | Sanity CMS |

---

## API Routes (ملخص)

| Endpoint | الغرض |
|----------|--------|
| `POST /api/orders` | إنشاء / تحديث طلبات |
| `GET/POST /api/orders/track` | تتبع وتعديل |
| `POST /api/discount/validate` | التحقق من كود الخصم |
| `GET/POST /api/discount-codes` | إدارة الأكواد (Admin) |
| `POST /api/subscribe` | اشتراك Newsletter |
| `POST /api/upload/payment-proof` | رفع إثبات InstaPay |
| `GET/POST /api/admin/profit-periods` | فترات الأرباح |
| `POST /api/newsletter/send` | إرسال حملة (Admin) |

---

## النشر

مناسب لـ **Vercel**: اربط المتغيرات أعلاه، وتأكد من تشغيل `sql/profit_periods.sql` على مشروع Supabase الإنتاجي.

---

## ملاحظات للبورتفوليو

- **الهوية البصرية:** لون العلامة `#E8489A` / `#FF4DA3` مع تباين محسّن و touch targets `44×44px` على الموبايل.
- **الأمان:** مسارات Admin و Studio محمية بكلمة مرور؛ عمليات حساسة على السيرفر فقط.
- هذا المستودع **خاص** (`private: true`) — للعرض استخدم لقطات شاشة أو Demo منفصل بدون مفاتيح حقيقية.

---

## الترخيص

مشروع خاص لعلامة ZØYA. جميع الحقوق محفوظة.
