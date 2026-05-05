import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const FROM_ADDRESS = process.env.RESEND_FROM || "Zoya <hello@zoya-store.com>";

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
      if (error.code === "23505") {
        return Response.json(
          { error: "Already subscribed" },
          { status: 409 }
        );
      }
      console.error("[subscribe] Supabase insert failed:", error);
      return Response.json({ error: error.message }, { status: 500 });
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
      subject: "Welcome to ZOYA \u2728",
      html: `
  <div style="margin:0; padding:0; background:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">

          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.08); font-family:Arial, sans-serif;">

            <!-- Header -->
            <tr>
              <td style="background:#000; color:#fff; text-align:center; padding:24px;">
                <h2 style="margin:0; letter-spacing:3px; font-weight:900;">ZØYA</h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 30px; text-align:center;">
                <h1 style="color:#FF4DA3; margin-bottom:12px;">
                  Welcome 🔥
                </h1>

                <p style="color:#555; font-size:14px; line-height:1.6;">
                  You’re officially part of the drop.<br/>
                  Get ready for exclusive pieces & early access.
                </p>

                <!-- CTA -->
                <a href="https://zoya-store.com"
                   style="display:inline-block; margin-top:24px; padding:12px 28px; background:#FF4DA3; color:#fff; text-decoration:none; border-radius:999px; font-size:12px; letter-spacing:1px; font-weight:bold;">
                  Explore ZOYA
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px; text-align:center; font-size:11px; color:#999;">
                © ${new Date().getFullYear()} ZOYA — All rights reserved
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
`,
    });

    if (emailError) {
      console.error("[subscribe] Resend send failed:", emailError);

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
