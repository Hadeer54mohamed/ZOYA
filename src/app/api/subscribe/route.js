import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. إعداد Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. إعداد Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// 3. إعداد الـ Rate Limiter (العسكري اللي على الباب)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  // يسمح بـ 3 محاولات فقط كل 24 ساعة لكل IP
  limiter: Ratelimit.slidingWindow(3, "1440 m"), 
  analytics: true,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_ADDRESS = process.env.RESEND_FROM || "Zoya <hello@zoya-store.com>";

// دالة لتنظيف الـ Errors وتحويلها لنص مفهوم في الـ Logs
function safeJson(value) {
  try {
    return JSON.stringify(value, (k, v) => {
      if (v instanceof Error) {
        return { name: v.name, message: v.message, statusCode: v.statusCode };
      }
      return v;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
}

export async function POST(req) {
  try {
    // --- [أولاً: حماية الـ API] ---
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success: limitSuccess } = await ratelimit.limit(ip);

    if (!limitSuccess) {
      return Response.json(
        { error: "Too many attempts. Please try again tomorrow." },
        { status: 429 } // 429 يعني Too Many Requests
      );
    }

    // --- [ثانياً: استلام وفحص البيانات] ---
    const { email } = await req.json();
    const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!EMAIL_REGEX.test(normalized)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    // --- [ثالثاً: حفظ المشترك في Supabase] ---
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email: normalized }]);

    if (dbError) {
      const isDuplicate = dbError.code === "23505";
      if (!isDuplicate) {
        console.error("[subscribe] Database error:", dbError);
        return Response.json({ error: "Failed to save subscriber" }, { status: 500 });
      }
      // لو مسجل قبل كدة، بنكمل عادي عشان نبعتله إيميل الترحيب كنوع من التذكير
      console.warn("[subscribe] Already subscribed — re-sending welcome email.");
    }

    // --- [رابعاً: إرسال إيميل الترحيب عبر Resend] ---
    if (!resend) {
      return Response.json({
        success: true,
        emailSent: false,
        warning: "Subscriber saved, but email service not configured.",
      });
    }

    const messageRefId = randomUUID();

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: normalized,
      subject: "You’re on the list — ZOYA",
      replyTo: "support@zoya-store.com",
      headers: {
        "X-Entity-Ref-ID": messageRefId,
        "List-Unsubscribe": "<mailto:unsubscribe@zoya-store.com>",
      },
      html: `
      <div style="margin:0; padding:0; background:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:40px 0; font-family:Arial, sans-serif;">
          <tr>
            <td align="center">
              <table width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:#000; padding:28px; text-align:center;">
                    <div style="font-size:22px; font-weight:900; letter-spacing:6px; color:#fff;">ZØYA</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px;">
                    <h1 style="color:#FF4DA3; margin:0 0 16px; font-size:26px;">You’re in ✦</h1>
                    <p style="color:#444; line-height:1.7; font-size:15px;">Welcome to ZOYA. This is not just a newsletter — it’s a front-row pass.</p>
                    <div style="background:#fafafa; border:1px solid #eee; border-radius:12px; padding:18px; margin:24px 0;">
                       <p style="margin:0; font-size:13px; color:#555; line-height:1.8;">
                        ✦ Early access to new drops<br/>
                        ✦ Limited pieces that don’t restock<br/>
                        ✦ Private updates from the team
                      </p>
                    </div>
                    <p style="margin:0; font-size:14px; color:#111; font-weight:600;">— ZOYA Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      `
    });

    if (emailError) {
      console.error(`[subscribe] Resend failed: ${safeJson(emailError)}`);
      return Response.json({
        success: true,
        emailSent: false,
        error: "Email could not be sent",
      });
    }

    return Response.json({ 
      success: true, 
      emailSent: true, 
      id: emailData?.id 
    });

  } catch (err) {
    console.error("[subscribe] Unexpected crash:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}