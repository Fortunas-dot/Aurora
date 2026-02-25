import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Aurora';

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

