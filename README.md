# ZOYA — The Cinematic E-Commerce Experience

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwind-css)
![Sanity](https://img.shields.io/badge/Sanity-CMS-F03E2F?style=for-the-badge&logo=sanity)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-purple?style=for-the-badge&logo=framer)

---

## ✨ المميزات

### تجربة المنتج
- **Cinematic Product Gallery**: عرض صور المنتجات بانسياب عمودي مع بيانات ثابتة (Sticky Info) .
- **Dynamic Color System**: تبديل فوري للصور والألوان والـ badges حسب اللون المختار، مع Fade سينمائي.
- **Quick View Modal**: معاينة سريعة لأي منتج بدون الخروج من القائمة.
- **Purchase Engine**: نظام كامل لاختيار المقاس، الكمية، وحساب السعر اللحظي.
- **Sticky Purchase Bar**: شريط شراء عائم على الموبايل لتسهيل الإضافة للسلة.

### الواجهة والمحتوى
- **Hero Section** ديناميكي مع animations.
- **Featured Drop Section**: قسم لإبراز إصدار/مجموعة جديدة.
- **Horizontal Product Section**: عرض أفقي للمنتجات.
- **Brand Section**: قسم تعريفي بالعلامة التجارية.
- **Testimonials**: آراء العملاء.
- **Reels Gallery**: معرض ريلز إنستغرام مع مودال تشغيل داخلي (Swiper coverflow + React Portal).
- **Social Section** و**Footer** متكاملين.

### تجربة المستخدم
- **Cart Drawer** متحرّك مع Context API.
- **Search Overlay** على مستوى الموقع.
- **Dark Mode** كامل عبر CSS variables.
- **Scroll Progress Bar** و**Hash Scroller** للروابط الداخلية.
- **Fully Responsive**: من الموبايل إلى الشاشات العملاقة.

---

## 🛠️ Stack

| الفئة | الأداة |
|------|--------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animations** | [Framer Motion 12](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Carousel** | [Swiper 12](https://swiperjs.com/) |
| **CMS** | [Sanity 5](https://www.sanity.io/) (`next-sanity`, `@sanity/image-url`, `@sanity/color-input`) |
| **State** | React Context (Cart) |

---

## 📦 محتوى الـ Sanity CMS

المشروع مرتبط بـ Sanity Studio (`/studio`) ويحوي الأنواع التالية:

- **`product`** — المنتجات (مع ألوان، صور لكل لون، مقاسات، badges، أسعار).
- **`category`** — التصنيفات.
- **`testimonial`** — آراء العملاء (الاسم، النص، التقييم، صورة).
- **`instagramReel`** — ريلز إنستغرام (ملف فيديو، صورة غلاف، رابط، ترتيب).

---

## 🚀 Getting Started

### 1) نسخ المشروع
```bash
git clone https://github.com/Hadeer54mohamed/zoya.git
cd zoya
```

### 2) تثبيت الاعتماديات
```bash
npm install
```

### 3) تشغيل البيئة المحلية
```bash
npm run dev
```

- الموقع: <http://localhost:3000>
- استوديو Sanity: <http://localhost:3000/studio>

### 5) البناء للإنتاج
```bash
npm run build
npm start
```

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── components/        # كل مكوّنات الواجهة (Hero, ProductSection, ReelsGallery, ...)
│   ├── studio/            # واجهة Sanity Studio المضمّنة
│   ├── product/[id]/      # صفحة المنتج المنفردة
│   ├── globals.css        # المتغيّرات والأدوات العامة
│   ├── layout.js
│   └── page.js            # الصفحة الرئيسية
├── sanity/
│   ├── lib/               # client.js, image.js, products.js, testimonials.js, instagramReel.js
│   ├── schemaTypes/       # productType, categoryType, testimonialType, instagramReel
│   ├── env.js
│   └── structure.js
└── lib/                   # (utilities)
```

---

## 📝 Scripts

| الأمر | الوصف |
|------|-------|
| `npm run dev` | تشغيل بيئة التطوير (Turbopack) |
| `npm run build` | بناء الإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm run lint` | فحص الكود |

---

## 🎨 ملاحظات للتصميم

- التصميم يعتمد على **CSS variables** للألوان (`bg-background`, `text-foreground`, `accent`, ...) لتسهيل التبديل بين Light/Dark.
- اللون المميّز للبراند: **`#FF4DA3`** (وردي عصري).
- خاصية `scrollbar-hide` متاحة كـ utility class مخصّص في `globals.css`.

---

## 📜 الترخيص

مشروع خاص — جميع الحقوق محفوظة لعلامة **ZOYA**.