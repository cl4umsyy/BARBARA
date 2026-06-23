import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "af60a3001@smtp-brevo.com";
const smtpPassword = process.env.SMTP_PASSWORD || "mgO4BCqaGJvbKhzN";
const smtpFrom = process.env.SMTP_FROM || "barahahaha15@gmail.com";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

export async function sendAdminContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 24px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 16px;">
      <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; color: #000;">
        Pesan Kontak Masuk Baru (BARBARA)
      </h2>
      <p style="font-size: 14px; margin-bottom: 16px;">
        Halo Admin, Anda menerima pesan baru dari formulir kontak situs web BARBARA.
      </p>
      
      <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 10px 0; font-weight: bold; width: 120px;">Pengirim:</td>
          <td style="padding: 10px 0;">${name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 10px 0; font-weight: bold;">Email:</td>
          <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #000; font-weight: bold; text-decoration: underline;">${email}</a></td>
        </tr>
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 10px 0; font-weight: bold;">Subjek:</td>
          <td style="padding: 10px 0; font-weight: bold;">${subject}</td>
        </tr>
      </table>

      <div style="background-color: #f9f9f9; border-radius: 12px; padding: 18px; font-size: 13px; line-height: 1.6; border: 1px solid #f0f0f0; white-space: pre-wrap;">
        ${message}
      </div>
      
      <div style="margin-top: 32px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eaeaea; padding-top: 16px;">
        Pesan ini dikirim secara otomatis dari formulir kontak BARBARA E-Commerce.
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"BARBARA Contact Form" <${smtpFrom}>`,
    to: smtpFrom, // Send notification to admin email
    subject: `[Kontak BARBARA] ${subject}`,
    text: `Pesan baru dari ${name} (${email}):\n\nSubjek: ${subject}\n\nPesan:\n${message}`,
    html: htmlContent,
  });

  console.log(`[Email Sent] Message ID: ${info.messageId}`);
  return info;
}
