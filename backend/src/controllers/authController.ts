import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { generateToken, sanitizeUser } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';
import { getRandomCharacter } from '../utils/characters';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// Accept ID tokens issued for any of the OAuth clients we ship (iOS, Android, web).
// CSV in env, e.g. "123-ios.apps.googleusercontent.com,456-web.apps.googleusercontent.com".
const GOOGLE_AUDIENCE = (process.env.GOOGLE_OAUTH_CLIENT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const googleOAuthClient = new OAuth2Client();

// Facebook Limited Login JWT verification — fetches FB's public keys from JWKS.
// In Limited Login mode the iOS SDK returns a signed OIDC JWT (AuthenticationToken)
// containing sub/email/name/picture as claims, so we don't need a Graph API call.
const facebookJwksClient = jwksRsa({
  jwksUri: 'https://www.facebook.com/.well-known/oauth/openid/jwks/',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getFacebookSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    callback(new Error('Missing kid in Facebook JWT header'));
    return;
  }
  facebookJwksClient.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err || new Error('Facebook signing key not found'));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

interface FacebookJwtClaims {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string | { data?: { url?: string } };
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

async function verifyFacebookAuthenticationToken(
  token: string,
  expectedAppId: string
): Promise<FacebookJwtClaims> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getFacebookSigningKey,
      {
        algorithms: ['RS256'],
        audience: expectedAppId,
        issuer: 'https://www.facebook.com',
      },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        if (!decoded || typeof decoded === 'string') {
          reject(new Error('Invalid Facebook JWT payload'));
          return;
        }
        resolve(decoded as FacebookJwtClaims);
      }
    );
  });
}

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
//
// Supports two flows:
//   1. iOS Limited Login (modern, recommended): client sends `authenticationToken`
//      which is a signed OIDC JWT issued by Facebook. We verify the signature
//      against FB's JWKS and read sub/email/name/picture from the claims.
//   2. Classic Login (legacy, Android fallback): client sends `accessToken`
//      plus email/name/facebookId/picture fetched via Graph API on-device.
//      Note: on iOS without App Tracking Transparency consent, the access
//      token's Graph API access is restricted — that's why we prefer flow 1.
export const facebookAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, authenticationToken } = req.body as {
      accessToken?: string;
      authenticationToken?: string;
      email?: string;
      name?: string;
      facebookId?: string;
      picture?: any;
    };

    let email: string | undefined;
    let name: string | undefined;
    let facebookId: string | undefined;
    let pictureUrl: string | undefined;

    if (authenticationToken) {
      // Flow 1: iOS Limited Login — verify the OIDC JWT and read claims.
      const expectedAppId = process.env.FACEBOOK_APP_ID;
      if (!expectedAppId) {
        console.error('FACEBOOK_APP_ID env var is not configured');
        res.status(500).json({
          success: false,
          message: 'Facebook login is not configured on the server',
        });
        return;
      }

      let claims: FacebookJwtClaims;
      try {
        claims = await verifyFacebookAuthenticationToken(authenticationToken, expectedAppId);
      } catch (verifyError: any) {
        console.warn('Facebook JWT verification failed:', verifyError?.message);
        res.status(401).json({
          success: false,
          message: 'Invalid Facebook authentication token',
        });
        return;
      }

      facebookId = claims.sub;
      // The Limited Login JWT does not always include the `email`/`name` claims.
      // Fall back to the values the client read from the FB Profile so existing
      // accounts can still be matched by email and new ones can be created.
      const body = req.body as { email?: string; name?: string };
      email = (claims.email || body.email)?.toLowerCase();
      name = claims.name || body.name;
      // Picture claim is sometimes a string URL, sometimes an object — normalize.
      if (typeof claims.picture === 'string') {
        pictureUrl = claims.picture;
      } else if (claims.picture && typeof claims.picture === 'object') {
        pictureUrl = claims.picture.data?.url;
      }
    } else if (accessToken) {
      // Flow 2: Classic Login — trust the user info fetched by client.
      const body = req.body as { email?: string; name?: string; facebookId?: string; picture?: any };
      email = body.email?.toLowerCase();
      name = body.name;
      facebookId = body.facebookId;
      pictureUrl = body.picture?.data?.url || (typeof body.picture === 'string' ? body.picture : undefined);
    } else {
      res.status(400).json({
        success: false,
        message: 'Facebook access token or authentication token is required',
      });
      return;
    }

    if (!facebookId) {
      res.status(400).json({
        success: false,
        message: 'Could not determine Facebook user identity',
      });
      return;
    }

    // Try to find existing user by email or Facebook ID
    let user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        { facebookId },
      ],
    });

    if (user) {
      // User exists, update Facebook ID if not set
      if (!user.facebookId && facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }

      // Update avatar if provided and user doesn't have one
      if (pictureUrl && !user.avatar) {
        user.avatar = pictureUrl;
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
        email,
        username,
        displayName: name || username,
        avatar: pictureUrl,
        avatarCharacter: getRandomCharacter(),
        nameColor: getRandomNameColor(),
        facebookId,
        isAnonymous: false,
      };

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

// @desc    Login/Register with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
      return;
    }

    if (GOOGLE_AUDIENCE.length === 0) {
      console.error('GOOGLE_OAUTH_CLIENT_IDS env var is not configured');
      res.status(500).json({
        success: false,
        message: 'Google login is not configured on the server',
      });
      return;
    }

    // Verify the ID token against our allowed OAuth client IDs.
    let payload;
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken,
        audience: GOOGLE_AUDIENCE,
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      console.warn('Google ID token verification failed:', verifyError?.message);
      res.status(401).json({
        success: false,
        message: 'Invalid Google ID token',
      });
      return;
    }

    if (!payload || !payload.sub) {
      res.status(401).json({
        success: false,
        message: 'Invalid Google ID token payload',
      });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const name = payload.name;
    const picture = payload.picture;

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId },
        ...(email ? [{ email }] : []),
      ],
    });

    if (user) {
      // Link Google ID if the account previously used another method
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        await user.save();
      }
      if (!user.avatarCharacter) {
        user.avatarCharacter = getRandomCharacter();
        await user.save();
      }
    } else {
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required for Google registration',
        });
        return;
      }

      // Generate a unique username from the Google profile
      const baseUsername =
        (name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') ||
          email.split('@')[0].replace(/[^a-z0-9_]/g, '')).slice(0, 25) || 'user';
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      user = await User.create({
        email,
        username,
        displayName: name || username,
        avatar: picture,
        avatarCharacter: getRandomCharacter(),
        nameColor: getRandomNameColor(),
        googleId,
        emailVerified: !!payload.email_verified,
        isAnonymous: false,
      });
    }

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
      message: error.message || 'Server error during Google authentication',
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
        'Email verified ✓',
        'Your email has been successfully verified. You can now switch back to the Aurora app — it will update automatically.',
        true
        // No deep link here: the app detects verification via a focus-based refresh,
        // so no button is needed and users won't see a "cannot open" Safari error.
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

  // Try the deep link in two formats (triple-slash = Expo Router canonical form,
  // double-slash = fallback used by older builds).  After 2 seconds, if the browser
  // is still showing this page the app didn't open — reveal plain "go back manually"
  // instructions instead of leaving the user stuck.
  const deepLinkScript = deepLink
    ? `<script>
        var _deepLink = '${deepLink}';
        // Attempt the open immediately
        function tryOpen() {
          try { window.location.href = _deepLink; } catch(e) {}
        }
        // iOS / Android might need a small delay before the app takes over
        setTimeout(tryOpen, 400);
        // If we are still here after 2 s the app did NOT open — show the fallback
        setTimeout(function() {
          var btn = document.getElementById('open-btn');
          var fb  = document.getElementById('fallback-msg');
          if (btn) btn.style.display = 'none';
          if (fb)  fb.style.display  = 'block';
        }, 2000);
      </script>`
    : '';

  const deepLinkHint = deepLink
    ? `
       <a
         id="open-btn"
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
       <p id="fallback-msg" style="display:none;margin-top:16px;font-size:14px;color:#d1d5db;line-height:1.6;">
         Couldn&apos;t open Aurora automatically.<br/>
         Please switch back to the Aurora app manually &mdash; your email is already verified. ✓
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








