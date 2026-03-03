import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Aurora';

/**
 * Base API URL used inside emails for redirect endpoints.
 * Falls back to the production Railway URL if API_URL is not set.
 */
const API_BASE_URL =
  (process.env.API_URL && process.env.API_URL.replace(/\/+$/, '')) ||
  'https://aurora-production.up.railway.app/api';

/**
 * Deep link base used to send users back into the mobile app.
 * This must match the `scheme` in the Expo config (aurora).
 */
const APP_SCHEME = 'aurora://';

if (!SENDGRID_API_KEY) {
  console.warn(
    '⚠️  SENDGRID_API_KEY is not set. Email sending will be disabled until this environment variable is configured.'
  );
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

if (!EMAIL_FROM_ADDRESS) {
  console.warn(
    '⚠️  EMAIL_FROM_ADDRESS is not set. Please configure a verified sender email (e.g. no-reply@aurora-commune.com).'
  );
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; message: string }> {
  try {
    if (!SENDGRID_API_KEY || !EMAIL_FROM_ADDRESS) {
      return {
        success: false,
        message: 'Email service is not configured. Please try again later.',
      };
    }

    const msg = {
      to: options.to,
      from: {
        email: EMAIL_FROM_ADDRESS,
        name: EMAIL_FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    await sgMail.send(msg);

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error: any) {
    // SendGrid provides detailed error information in error.response.body
    const sendgridMessage =
      error?.response?.body?.errors?.[0]?.message ||
      error?.message ||
      'Failed to send email. Please try again later.';

    console.error('❌ Error sending email via SendGrid:', sendgridMessage);

    return {
      success: false,
      message: sendgridMessage,
    };
  }
}

// Very simple HTML → text fallback
function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
}

/**
 * High-level email helpers used by auth flows
 */

export async function sendWelcomeEmail(options: {
  to: string;
  username: string;
  verificationToken?: string | null;
}): Promise<{ success: boolean; message: string }> {
  const verificationLink = options.verificationToken
    ? `${API_BASE_URL}/auth/verify-email-redirect?token=${encodeURIComponent(options.verificationToken)}`
    : APP_SCHEME;

  const html = getWelcomeEmailTemplate({
    username: options.username,
    verificationLink,
    includeVerificationCta: !!options.verificationToken,
  });

  return sendEmail({
    to: options.to,
    subject: 'Welcome to Aurora 🌌',
    html,
  });
}

export async function sendVerificationEmail(options: {
  to: string;
  username: string;
  verificationToken: string;
}): Promise<{ success: boolean; message: string }> {
  const verificationLink = `${API_BASE_URL}/auth/verify-email-redirect?token=${encodeURIComponent(
    options.verificationToken
  )}`;

  const html = getVerificationEmailTemplate({
    username: options.username,
    verificationLink,
  });

  return sendEmail({
    to: options.to,
    subject: 'Verify your email for Aurora',
    html,
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  username: string;
  resetToken: string;
}): Promise<{ success: boolean; message: string }> {
  const resetLink = `${API_BASE_URL}/auth/reset-password-redirect?token=${encodeURIComponent(options.resetToken)}`;

  const html = getPasswordResetEmailTemplate({
    username: options.username,
    resetLink,
  });

  return sendEmail({
    to: options.to,
    subject: 'Reset your Aurora password',
    html,
  });
}

/**
 * Templates
 */

function baseEmailLayout(content: { title: string; body: string; ctaLabel?: string; ctaUrl?: string }): string {
  const { title, body, ctaLabel, ctaUrl } = content;

  const ctaSection =
    ctaLabel && ctaUrl
      ? `<tr>
           <td align="center" style="padding: 24px 0 8px 0;">
             <a href="${ctaUrl}" 
                style="
                  display:inline-block;
                  padding: 12px 28px;
                  border-radius: 999px;
                  background-color:#60A5FA;
                  background-image:none;
                  color:#020617;
                  text-decoration:none;
                  font-weight:600;
                  font-size:16px;
                  border:1px solid #93C5FD;
                  box-shadow:0 0 0 1px rgba(15,23,42,0.8), 0 12px 30px rgba(15,23,42,0.8);
                ">
               ${ctaLabel}
             </a>
           </td>
         </tr>
         <tr>
           <td align="center" style="padding: 0 32px 24px 32px; font-size: 12px; color: #9ca3af;">
             Or copy and paste this URL into your browser:<br />
             <span style="word-break: break-all;">${ctaUrl}</span>
           </td>
         </tr>`
      : '';

  return `
  <html>
    <body style="margin:0;padding:0;background:#050816;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#050816;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(145deg,#020617,#050816 40%,#020617 100%);border-radius:24px;border:1px solid rgba(148,163,184,0.35);box-shadow:0 32px 80px rgba(15,23,42,0.9);overflow:hidden;">
              <tr>
                <td align="left" style="padding:20px 24px 4px 24px;">
                  <span style="display:inline-block;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;">
                    Aurora
                  </span>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:4px 24px 0 24px;">
                  <h1 style="margin:0;color:#e5e7eb;font-size:22px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:600;letter-spacing:0.02em;">
                    ${title}
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:16px 24px 8px 24px;color:#cbd5f5;font-size:14px;line-height:1.7;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  ${body}
                </td>
              </tr>
              ${ctaSection}
              <tr>
                <td align="center" style="padding:16px 24px 24px 24px;color:#6b7280;font-size:11px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  You’re receiving this email because it’s related to your Aurora account.<br/>
                  If this wasn’t you, you can ignore this message and your account will stay as it is.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim();
}

function getWelcomeEmailTemplate(options: {
  username: string;
  verificationLink: string;
  includeVerificationCta: boolean;
}): string {
  const { username } = options;

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${username || 'there'},</p>
    <p style="margin:0 0 12px 0;">
      Welcome to <strong>Aurora</strong> – your safe space for guided reflection, journaling, and mental health support.
    </p>
    <p style="margin:0 0 12px 0;">
      We’re here to help you slow down, make sense of what you feel, and gently move towards a lighter mind.
    </p>
  `;

  return baseEmailLayout({
    title: 'Welcome to Aurora 🌌',
    body,
    // Do not include a verification button in the welcome email;
    // a dedicated verification email is sent separately.
    ctaLabel: undefined,
    ctaUrl: undefined,
  });
}

function getVerificationEmailTemplate(options: { username: string; verificationLink: string }): string {
  const { username, verificationLink } = options;

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${username || 'there'},</p>
    <p style="margin:0 0 12px 0;">
      Please confirm that this is your email address so we can keep your Aurora account secure and send you important updates.
    </p>
    <p style="margin:0 0 12px 0;">
      Tap the button below to verify your email. If you didn’t create an Aurora account, you can safely ignore this email.
    </p>
  `;

  return baseEmailLayout({
    title: 'Verify your Aurora email',
    body,
    ctaLabel: 'Verify email',
    ctaUrl: verificationLink,
  });
}

function getPasswordResetEmailTemplate(options: { username: string; resetLink: string }): string {
  const { username, resetLink } = options;

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${username || 'there'},</p>
    <p style="margin:0 0 12px 0;">
      We received a request to reset the password for your Aurora account.
    </p>
    <p style="margin:0 0 12px 0;">
      If this was you, tap the button below to choose a new password. This link will be valid for 30 minutes.
    </p>
    <p style="margin:0 0 12px 0;">
      If you didn’t request a password reset, you can ignore this email – your password will stay the same.
    </p>
  `;

  return baseEmailLayout({
    title: 'Reset your Aurora password',
    body,
    ctaLabel: 'Reset password',
    ctaUrl: resetLink,
  });
}

