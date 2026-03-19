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
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      console.error(`❌ Error sending SMS verification code [Twilio code: ${errorCode}]:`, errorMessage);
      
      // Invalid phone number format
      if (errorCode === 21211 || errorMessage.toLowerCase().includes('invalid')) {
        return {
          success: false,
          message: 'Invalid phone number. Please check the number and country code, and try again.',
        };
      }
      
      // Unsubscribed / opted out
      if (errorCode === 21614 || errorMessage.toLowerCase().includes('unsubscribed')) {
        return {
          success: false,
          message: 'This phone number cannot receive SMS messages. Please use a different number.',
        };
      }
      
      // Geographic permission denied (country not enabled in Twilio)
      // 21408 = permission not enabled for region
      // 21215 = account not authorized for region
      // 30004 = message blocked
      if (
        errorCode === 21408 ||
        errorCode === 21215 ||
        errorCode === 30004 ||
        errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('not authorized') ||
        errorMessage.toLowerCase().includes('geo') ||
        errorMessage.toLowerCase().includes('region')
      ) {
        return {
          success: false,
          message: 'SMS is currently not supported for your country. Please contact support.',
        };
      }

      // Rate limit / too many requests
      if (errorCode === 20429 || errorMessage.toLowerCase().includes('too many')) {
        return {
          success: false,
          message: 'Too many SMS requests. Please wait a moment and try again.',
        };
      }
      
      // Generic error
      return {
        success: false,
        message: 'Failed to send verification code. Please check your phone number and try again.',
      };
    }
  }

  formatPhoneNumber(phone: string): string | null {
    if (!phone || typeof phone !== 'string') {
      return null;
    }
    
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
    
    // Must start with +
    if (!cleaned.startsWith('+')) {
      return null;
    }
    
    // E.164 format: +[country code][number]
    // Minimum: +1 + 1 digit = 2 characters (e.g., +1)
    // Maximum: +[country code up to 3 digits] + [number up to 14 digits] = 15 characters total
    // But we need at least a country code and some digits
    if (cleaned.length < 4) {
      return null; // Too short (e.g., "+12" is not valid)
    }
    
    // Check if it matches E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(cleaned)) {
      return null;
    }
    
    return cleaned;
  }
}

export const smsVerificationService = new SMSVerificationService();

