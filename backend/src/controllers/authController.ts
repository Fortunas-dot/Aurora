import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { generateToken, sanitizeUser } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';
import { getRandomCharacter } from '../utils/characters';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// Available name colors
const NAME_COLORS = ['Yellow', 'Blue', 'Pink', 'Green', 'Red', 'Purple'];

// Helper function to get a random name color
const getRandomNameColor = (): string => {
  const randomIndex = Math.floor(Math.random() * NAME_COLORS.length);
  return NAME_COLORS[randomIndex];
};

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
  const relativeUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${relativeUrl}`;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
      });
      return;
    }

    // Generate email verification token with expiry (48 hours)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create user with random avatar character and random name color
    const user = await User.create({
      email,
      password,
      username,
      displayName: displayName || username,
      avatarCharacter: getRandomCharacter(),
      nameColor: getRandomNameColor(),
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    // Fire-and-forget welcome & verification emails (do not block registration on failures)
    (async () => {
      try {
        await sendWelcomeEmail({
          to: user.email,
          username: user.displayName || user.username,
          verificationToken: emailVerificationToken,
        });
        await sendVerificationEmail({
          to: user.email,
          username: user.displayName || user.username,
          verificationToken: emailVerificationToken,
        });
      } catch (emailError) {
        console.error('Error sending welcome/verification email:', emailError);
      }
    })();

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Check username availability
// @route   GET /api/auth/check-username?username=foo
// @access  Public
export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = (req.query.username as string | undefined)?.trim();

    if (!username) {
      res.status(400).json({
        success: false,
        message: 'Username is required',
      });
      return;
    }

    // Basic validation should mirror registration rules
    if (username.length < 3 || username.length > 30) {
      res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores',
      });
      return;
    }

    const existingUser = await User.findOne({ username }).select('_id').lean();

    res.json({
      success: true,
      data: {
        available: !existingUser,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while checking username',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Normalize avatar URL before returning
    const userData = sanitizeUser(user);
    if (userData.avatar) {
      userData.avatar = normalizeUrl(userData.avatar);
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Login/Register with Facebook
// @route   POST /api/auth/facebook
// @access  Public
export const facebookAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, email, name, facebookId, picture } = req.body;

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: 'Facebook access token is required',
      });
      return;
    }

    // Try to find existing user by email or Facebook ID
    let user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { 'facebookId': facebookId },
      ],
    });

    if (user) {
      // User exists, update Facebook ID if not set
      if (!user.facebookId && facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }

      // Update avatar if provided and user doesn't have one
      if (picture?.data?.url && !user.avatar) {
        user.avatar = picture.data.url;
        await user.save();
      }

      // Assign character if user doesn't have one
      if (!user.avatarCharacter) {
        user.avatarCharacter = getRandomCharacter();
        await user.save();
      }
    } else {
      // Create new user
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required for Facebook registration',
        });
        return;
      }

      // Generate username from email or name
      const baseUsername = name?.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0];
      let username = baseUsername;
      let counter = 1;

      // Ensure unique username
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      // Create user without password (Facebook users don't need password)
      const userData: any = {
        email: email.toLowerCase(),
        username,
        displayName: name || username,
        avatar: picture?.data?.url,
        avatarCharacter: getRandomCharacter(), // Assign random character
        nameColor: getRandomNameColor(), // Assign random name color
        facebookId,
        isAnonymous: false,
      };
      
      // Only add password if not a Facebook user (shouldn't happen, but safety check)
      if (!facebookId) {
        userData.password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      }
      
      user = await User.create(userData);
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Facebook authentication',
    });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/request-password-reset
// @access  Public
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Do not leak whether the email exists
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Send the email in the background so the API responds quickly
    (async () => {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          username: user.displayName || user.username,
          resetToken,
        });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Intentionally do not throw – the client already received a response
      }
    })();

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while requesting password reset',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Set new password – pre-save hook will hash it
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password successfully reset',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while resetting password',
    });
  }
};

// @desc    Verify email via API (token from app)
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
      return;
    }

    if (!user.emailVerified) {
      user.emailVerified = true;
    }
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email successfully verified',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while verifying email',
    });
  }
};

// @desc    Resend verification email for the currently authenticated user
// @route   POST /api/auth/send-verification-email
// @access  Private
export const sendVerificationEmailEndpoint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Always use the authenticated user – do NOT trust arbitrary email input
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    if (user.emailVerified) {
      res.json({
        success: true,
        message: 'Email already verified',
      });
      return;
    }

    // Generate a fresh verification token with expiry (48 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        username: user.displayName || user.username,
        verificationToken,
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while sending verification email',
    });
  }
};

// @desc    HTML redirect for email verification (from email clients)
// @route   GET /api/auth/verify-email-redirect?token=...
// @access  Public
export const verifyEmailRedirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string | undefined) || '';

    if (!token) {
      res.status(400).send(getSimpleStatusPage('Verification failed', 'No verification token provided.', false));
      return;
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).send(getSimpleStatusPage('Verification failed', 'Invalid or expired verification token.', false));
      return;
    }

    if (!user.emailVerified) {
      user.emailVerified = true;
    }
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.send(
      getSimpleStatusPage(
        'Email verified',
        'Your email has been successfully verified. You can now return to the Aurora app.',
        true,
        'aurora://email-verified'
      )
    );
  } catch (error) {
    console.error('Error in verifyEmailRedirect:', error);
    res.status(500).send(
      getSimpleStatusPage('Verification failed', 'An error occurred while verifying your email. Please try again.', false)
    );
  }
};

// @desc    HTML redirect for password reset (from email clients)
// @route   GET /api/auth/reset-password-redirect?token=...
// @access  Public
export const resetPasswordRedirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string | undefined) || '';

    if (!token) {
      res.status(400).send(getSimpleStatusPage('Reset link invalid', 'No reset token provided.', false));
      return;
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res
        .status(400)
        .send(
          getSimpleStatusPage(
            'Reset link invalid',
            'This password reset link is invalid or has expired. Please request a new one from the app.',
            false
          )
        );
      return;
    }

    // Deep link back into the app with the token so the app can complete the reset
    const deepLink = `aurora://reset-password?token=${encodeURIComponent(token)}`;

    res.send(
      getSimpleStatusPage(
        'Reset your password',
        'We are redirecting you back to Aurora to choose a new password.',
        true,
        deepLink
      )
    );
  } catch (error) {
    console.error('Error in resetPasswordRedirect:', error);
    res
      .status(500)
      .send(
        getSimpleStatusPage('Reset link invalid', 'An error occurred while preparing your reset link. Please try again.', false)
      );
  }
};

// Simple HTML status page used by redirect endpoints
function getSimpleStatusPage(title: string, message: string, success: boolean, deepLink?: string): string {
  const background = success
    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
    : 'linear-gradient(135deg,#ef4444,#b91c1c)';

  const deepLinkScript = deepLink
    ? `<script>
         setTimeout(function() {
           window.location.href = '${deepLink}';
         }, 800);
       </script>`
    : '';

  const deepLinkHint = deepLink
    ? `
       <a 
         href="${deepLink}" 
         style="
           display:inline-block;
           margin-top:20px;
           padding:12px 28px;
           border-radius:999px;
           background:linear-gradient(135deg,#6366f1,#a855f7);
           color:#f9fafb;
           text-decoration:none;
           font-weight:600;
           font-size:15px;
         "
       >
         Open Aurora
       </a>
       <p style="margin-top:12px;font-size:13px;color:#9ca3af;">
         If nothing happens, tap the button above again or copy and paste the link into your browser&apos;s address bar.
       </p>`
    : '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${deepLinkScript}
      </head>
      <body style="margin:0;padding:0;background:#020617;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
          <div style="max-width:480px;width:100%;background:radial-gradient(circle at top,#020617,#020617);border-radius:24px;border:1px solid rgba(148,163,184,0.4);box-shadow:0 24px 80px rgba(15,23,42,0.9);padding:32px 24px;text-align:center;">
            <div style="width:56px;height:56px;margin:0 auto 16px auto;border-radius:999px;background:${background};display:flex;align-items:center;justify-content:center;color:#f9fafb;font-size:28px;">
              ${success ? '✓' : '!'}
            </div>
            <h1 style="margin:0 0 12px 0;color:#e5e7eb;font-size:22px;">${title}</h1>
            <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.6;">
              ${message}
            </p>
            ${deepLinkHint}
          </div>
        </div>
      </body>
    </html>
  `.trim();
}








