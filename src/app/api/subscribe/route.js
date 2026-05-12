import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const FROM_ADDRESS = process.env.RESEND_FROM || "Zoya <hello@zoya-store.com>";

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
    const { email } = await req.json();
    const normalized =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!EMAIL_REGEX.test(normalized)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    // 1) Save subscriber to Supabase.
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email: normalized }]);

    if (error) {
      const isDuplicate = error.code === "23505";
      if (!isDuplicate) {
        console.error("[subscribe] Supabase insert failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
      }

      // If the user tries to subscribe again with the same email, we still
      // attempt to send the welcome email. This avoids the "nothing was sent"
      // experience on retries.
      console.warn("[subscribe] Already subscribed — proceeding to email.");
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[subscribe] RESEND_API_KEY is missing — skipping email.");
      return Response.json({
        success: true,
        emailSent: false,
        warning: "Subscriber saved, but email service is not configured.",
      });
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: normalized,
      subject: "Order Confirmation",
      replyTo: "support@zoya-store.com",

      headers: {
        "X-Entity-Ref-ID": emailData?.id,
        "List-Unsubscribe": "<mailto:unsubscribe@zoya-store.com>",
      },
    
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#111;">Thank you for your order 👌</h2>
        
        <p>Hi there,</p>
    
        <p>
          We’ve received your order successfully and it’s now being processed.
          You’ll receive another update once it’s shipped.
        </p>
    
        <hr />
    
        <p style="font-size: 14px; color: #555;">
          If you have any questions, just reply to this email — we’re here to help.
        </p>
    
        <p style="margin-top:20px;">
          — ZOYA Team
        </p>
      </div>
    `      });
    console.log("RESEND DATA:", emailData);
    console.log("RESEND ERROR:", emailError);

    if (emailError) {
      console.error(
        `[subscribe] Resend send failed to=${safeJson(normalized)} err=${safeJson({
          name: emailError?.name,
          message: emailError?.message,
          statusCode: emailError?.statusCode ?? null,
        })}`
      );

      return Response.json({
        success: true,
        emailSent: false,
        emailError: emailError.message ?? String(emailError),
      });
    }

    console.log("[subscribe] Email queued via Resend:", emailData?.id);
    return Response.json({ success: true, emailSent: true, id: emailData?.id });
  } catch (err) {
    console.error("[subscribe] Unexpected error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
