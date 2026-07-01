/**
 * VELA Email Service
 * ------------------
 * Uses Resend (https://resend.com) — sends email over a normal HTTPS API
 * call instead of raw SMTP. This is REQUIRED on Railway, which blocks/throttles
 * outbound SMTP ports (25, 465, 587) on most plans, causing "Connection timeout"
 * even with correct Gmail credentials.
 *
 * Setup (free — 3,000 emails/month, 100/day):
 *   1. Go to resend.com → sign up (no credit card needed)
 *   2. Go to API Keys → Create API Key → copy it
 *   3. In Railway → Variables, add:
 *        RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxx
 *        EMAIL_FROM      = VELA <onboarding@resend.dev>   (works immediately,
 *                           no domain verification needed for testing)
 *   4. (Optional, for production) Verify your own domain in Resend to send
 *      from your own address instead of onboarding@resend.dev
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email service not configured. Set RESEND_API_KEY in Railway Variables.');
  }

  const from = process.env.EMAIL_FROM || 'VELA <onboarding@resend.dev>';

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
    // HTTPS API call — fast, reliable, never blocked by Railway's network policy
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Resend API error (${res.status}): ${data.message || JSON.stringify(data)}`);
  }

  console.log(`✅ Email sent via Resend, id: ${data.id}`);
  return data;
}

export const sendPasswordResetEmail = async (to, username, resetUrl) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your VELA password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#15131a;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,#533747,#A78BFA,#86BBBD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;margin-bottom:24px;">
                VELA
              </div>
              <h1 style="color:#fff;font-size:20px;margin:0 0 12px;">Reset your password</h1>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 28px;">
                Hi @${username}, click below to set a new password. This link expires in 1 hour.
              </p>
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#533747,#A78BFA);color:#fff;text-decoration:none;font-weight:700;font-size:15px;">
                Reset Password
              </a>
              <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:28px 0 0;word-break:break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
        </table>
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:20px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendViaResend({
    to,
    subject: '🔑 Reset your VELA password',
    text: `Hi @${username},\n\nReset your VELA password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n— VELA`,
    html,
  });
};
