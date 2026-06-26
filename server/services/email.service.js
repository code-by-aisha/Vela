/**
 * VELA Email Service
 * ------------------
 * Uses Nodemailer with any SMTP provider.
 *
 * Required env vars:
 *   SMTP_HOST     — e.g. smtp.gmail.com | smtp.sendgrid.net | mail.privateemail.com
 *   SMTP_PORT     — e.g. 465 (SSL) or 587 (TLS/STARTTLS)
 *   SMTP_SECURE   — "true" for port 465, "false" for 587
 *   SMTP_USER     — your email address / API key username
 *   SMTP_PASS     — your email password / API key
 *   EMAIL_FROM    — "VELA <noreply@yourdomain.com>"
 *
 * For Gmail:
 *   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false
 *   SMTP_USER=youraddress@gmail.com  SMTP_PASS=your-app-password
 *   (Enable 2FA on Google account, then generate an App Password)
 *
 * For SendGrid:
 *   SMTP_HOST=smtp.sendgrid.net  SMTP_PORT=587  SMTP_SECURE=false
 *   SMTP_USER=apikey  SMTP_PASS=SG.xxxx...
 */

import nodemailer from 'nodemailer';

// Lazy-create transporter so missing env vars don't crash the server on boot
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_SECURE === 'true',  // true → SSL (465), false → STARTTLS (587)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },  // allow self-signed certs in dev
  });

  return _transporter;
}

/**
 * Send a password-reset email.
 * @param {string} to        recipient email
 * @param {string} username  recipient username (for personalisation)
 * @param {string} resetUrl  full reset link
 */
export const sendPasswordResetEmail = async (to, username, resetUrl) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || `"VELA" <noreply@vela.app>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your VELA password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0"
          style="background:linear-gradient(135deg,#111118,#0f0d12);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-family:'Cabinet Grotesk','Clash Display',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,#533747,#A78BFA,#86BBBD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;">
                      VELA
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:15px;color:rgba(255,255,255,0.5);margin:0 0 10px;">Hey @${username},</p>
              <h1 style="font-size:26px;font-weight:800;color:#ffffff;margin:0 0 16px;line-height:1.2;">
                Reset your password
              </h1>
              <p style="font-size:14px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0 0 28px;">
                We received a request to reset your VELA password. Click the button below to choose a new one.
                This link expires in <strong style="color:rgba(255,255,255,0.7);">1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#533747,#A78BFA,#86BBBD);padding:1px;">
                    <a href="${resetUrl}"
                      style="display:inline-block;padding:14px 36px;border-radius:11px;background:linear-gradient(135deg,#533747,#A78BFA,#86BBBD);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;">
                      Reset Password ✨
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:rgba(255,255,255,0.25);margin:0 0 8px;">Or paste this link into your browser:</p>
              <p style="font-size:11px;color:rgba(167,139,250,0.6);word-break:break-all;margin:0 0 28px;">${resetUrl}</p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 24px;" />

              <p style="font-size:12px;color:rgba(255,255,255,0.22);margin:0;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email —
                your account is secure and nothing has changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.18);margin:0;">
                © ${new Date().getFullYear()} VELA · Share Your Vibe
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const info = await transporter.sendMail({
    from,
    to,
    subject: '🔑 Reset your VELA password',
    text: `Hi @${username},\n\nReset your VELA password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n— VELA`,
    html,
  });

  return info;
};
