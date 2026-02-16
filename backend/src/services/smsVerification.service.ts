import { Twilio } from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  // We deliberately don't throw here to avoid crashing the app if SMS is not configured.
  // The controller will check availability and return a clear error message.
  console.warn(
    '⚠️ Twilio credentials not fully configured. SMS verification will be disabled until TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are set.'
  );
}

export class SMSVerificationService {
  private client: Twilio | null;
  private fromNumber: string | null;

  constructor() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      this.client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.fromNumber = TWILIO_PHONE_NUMBER;
    } else {
      this.client = null;
      this.fromNumber = null;
    }
  }

  isConfigured(): boolean {
    return !!this.client && !!this.fromNumber;
  }

  generateVerificationCode(): string {
    // 6-digit code with leading zeros (000000–999999)
    return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.fromNumber) {
      return {
        success: false,
        message: 'SMS service is not configured. Please contact support.',
      };
    }

    const body =
      `Your Aurora verification code is: ${code}\n\n` +
      'This code will expire in 5 minutes.';

    try {
      await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: phoneNumber,
      });

      return {
        success: true,
        message: 'Verification code sent',
      };
    } catch (error: any) {
      console.error('❌ Error sending SMS verification code:', error?.message || error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  formatPhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!cleaned.startsWith('+')) {
      // For now require E.164 format with leading +
      return null;
    }
    return cleaned;
  }
}

export const smsVerificationService = new SMSVerificationService();

