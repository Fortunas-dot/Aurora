import { Twilio } from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID,
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
  private messagingServiceSid: string | null;

  constructor() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && (TWILIO_PHONE_NUMBER || TWILIO_MESSAGING_SERVICE_SID)) {
      this.client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.fromNumber = TWILIO_PHONE_NUMBER || null;
      this.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID || null;
    } else {
      this.client = null;
      this.fromNumber = null;
      this.messagingServiceSid = null;
    }
  }

  isConfigured(): boolean {
    return !!this.client && (!!this.fromNumber || !!this.messagingServiceSid);
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
      const payload: any = {
        body,
        to: phoneNumber,
      };

      // Prefer Messaging Service for international sending (it can pick a compliant sender per destination).
      if (this.messagingServiceSid) {
        payload.messagingServiceSid = this.messagingServiceSid;
      } else if (this.fromNumber) {
        payload.from = this.fromNumber;
      }

      await this.client.messages.create(payload);

      return {
        success: true,
        message: 'Verification code sent',
      };
    } catch (error: any) {
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      const normalizedMessage = errorMessage.toLowerCase();
      console.error(
        `❌ Error sending SMS verification code [Twilio code: ${errorCode}, status: ${error?.status}]:`,
        errorMessage
      );
      
      // Invalid phone number format
      if (errorCode === 21211 || normalizedMessage.includes('invalid')) {
        return {
          success: false,
          message: 'Invalid phone number. Please check the number and country code, and try again.',
        };
      }
      
      // Unsubscribed / opted out
      if (errorCode === 21614 || normalizedMessage.includes('unsubscribed')) {
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
        errorCode === 21608 ||
        normalizedMessage.includes('permission') ||
        normalizedMessage.includes('not authorized') ||
        normalizedMessage.includes('geo') ||
        normalizedMessage.includes('region')
      ) {
        return {
          success: false,
          message: 'SMS sending to this country/region is not enabled for the current Twilio sender. Please update Twilio regional permissions or sender configuration.',
        };
      }

      // US A2P/10DLC and carrier filtering issues
      if (
        errorCode === 30034 ||
        errorCode === 30007 ||
        normalizedMessage.includes('10dlc') ||
        normalizedMessage.includes('a2p')
      ) {
        return {
          success: false,
          message: 'SMS blocked by carrier policy. Please complete Twilio A2P 10DLC registration for your US sender.',
        };
      }

      // Twilio "To/From combination" errors (commonly sender-country/network restrictions)
      if (errorCode === 21612 || normalizedMessage.includes('combination of "to" and/or "from"')) {
        return {
          success: false,
          message:
            'This sender number cannot deliver to the selected destination. Configure a Twilio Messaging Service with a sender compatible with that country.',
        };
      }

      // Rate limit / too many requests
      if (errorCode === 20429 || normalizedMessage.includes('too many')) {
        return {
          success: false,
          message: 'Too many SMS requests. Please wait a moment and try again.',
        };
      }
      
      // Generic error
      return {
        success: false,
        message: errorCode
          ? `Failed to send verification code (Twilio error ${errorCode}). Please contact support.`
          : 'Failed to send verification code. Please try again.',
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

