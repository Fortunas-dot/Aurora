import { Request, Response } from 'express';
import PhoneVerification from '../models/PhoneVerification';
import { smsVerificationService } from '../services/smsVerification.service';

// POST /api/auth/send-verification-code
export const sendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number } = req.body as { phone_number?: string };

    if (!phone_number) {
      res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
      return;
    }

    if (!smsVerificationService.isConfigured()) {
      res.status(500).json({
        success: false,
        message: 'SMS verification is not available. Please try again later.',
      });
      return;
    }

    const formattedPhone = smsVerificationService.formatPhoneNumber(phone_number);
    if (!formattedPhone) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please include country code, e.g. +31612345678.',
      });
      return;
    }

    // Rate limit: max 3 codes per hour per phone number
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await PhoneVerification.countDocuments({
      phoneNumber: formattedPhone,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= 3) {
      res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again later.',
      });
      return;
    }

    const code = smsVerificationService.generateVerificationCode();
    const result = await smsVerificationService.sendVerificationCode(formattedPhone, code);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.message,
      });
      return;
    }

    await PhoneVerification.create({
      phoneNumber: formattedPhone,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      phone_number: formattedPhone,
    });
  } catch (error: any) {
    console.error('Error in sendVerificationCode:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to send verification code',
    });
  }
};

// POST /api/auth/verify-phone
export const verifyPhoneCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number, code } = req.body as { phone_number?: string; code?: string };

    if (!phone_number || !code) {
      res.status(400).json({
        success: false,
        message: 'Phone number and code are required',
      });
      return;
    }

    const formattedPhone = smsVerificationService.formatPhoneNumber(phone_number);
    if (!formattedPhone) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please include country code, e.g. +31612345678.',
      });
      return;
    }

    const verification = await PhoneVerification.findOne({ phoneNumber: formattedPhone })
      .sort({ createdAt: -1 })
      .exec();

    if (!verification) {
      res.status(400).json({
        success: false,
        message: 'No verification found. Please request a new code.',
      });
      return;
    }

    const now = new Date();
    if (now > verification.expiresAt) {
      res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
      return;
    }

    if (verification.attempts >= 3) {
      res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new code.',
      });
      return;
    }

    if (verification.code !== code) {
      verification.attempts += 1;
      await verification.save();

      res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
      return;
    }

    verification.attempts += 1;
    await verification.save();

    res.json({
      success: true,
      message: 'Phone verified successfully',
    });
  } catch (error: any) {
    console.error('Error in verifyPhoneCode:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to verify phone',
    });
  }
}

