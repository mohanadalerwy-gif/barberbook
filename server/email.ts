import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, code: string, lang: "en" | "ar" = "en") {
  const isAr = lang === "ar";

  const subject = isAr ? "رمز التحقق من بريدك الإلكتروني" : "Verify your email";

  const html = isAr
    ? `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">مرحباً بك في شيفي</h2>
        <p style="color:#444">استخدم الرمز أدناه لتأكيد بريدك الإلكتروني. صالح لمدة <strong>10 دقائق</strong>.</p>
        <div style="margin:24px 0;text-align:center">
          <span style="display:inline-block;font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;background:#f4f4f5;padding:16px 32px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#888;font-size:13px">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني.</p>
      </div>`
    : `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Welcome to SHVI</h2>
        <p style="color:#444">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="margin:24px 0;text-align:center">
          <span style="display:inline-block;font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;background:#f4f4f5;padding:16px 32px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "SHVI <no-reply@shvi.app>",
    to,
    subject,
    html,
  });
}
