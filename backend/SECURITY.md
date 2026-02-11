# Security Configuration

## Required Environment Variables

The following environment variables **MUST** be set in production:

### Critical (Application will not start without these):
- `JWT_SECRET` - Secret key for JWT token signing (must be a strong random string)
- `MONGODB_URI` - MongoDB connection string

### Important (Required for full functionality):
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `FRONTEND_URL` - Frontend application URL (for CORS)
- `API_URL` - Backend API URL

### Optional:
- `FACEBOOK_APP_ID` - Facebook app ID for social login
- `FACEBOOK_CLIENT_TOKEN` - Facebook client token
- `POSTHOG_API_KEY` - PostHog analytics key
- `NODE_ENV` - Set to `production` for production deployments

## Security Features Implemented

### 1. Authentication & Authorization
- JWT-based authentication
- Token expiration (30 days)
- Protected routes require valid JWT token
- No hardcoded secrets - application fails to start if JWT_SECRET is not set

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP (stricter)
- **Upload endpoints**: 20 requests per hour per IP

### 3. CORS Protection
- Configured with specific allowed origins
- In production, only allows requests from configured FRONTEND_URL
- In development, allows localhost origins

### 4. Security Headers
- Helmet.js configured with Content Security Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (HSTS) in production

### 5. Input Validation
- Express-validator for request validation
- Password minimum length: 6 characters
- Content length limits on posts, comments, messages
- SQL injection prevention via Mongoose (parameterized queries)

### 6. Error Handling
- No stack traces exposed in production
- Generic error messages for clients
- Detailed logging only in development mode

### 7. Debug Endpoints
- Debug endpoints (`/api/posts/debug/*`) only available in development
- Removed in production builds

### 8. Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Passwords never logged or exposed in responses
- Password validation on registration and updates

## Production Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set
- [ ] `JWT_SECRET` is a strong random string (at least 32 characters)
- [ ] `NODE_ENV=production` is set
- [ ] CORS origins are configured correctly
- [ ] Database connection uses SSL/TLS
- [ ] HTTPS is enabled (required for HSTS)
- [ ] Rate limiting is appropriate for your traffic
- [ ] Debug endpoints are disabled
- [ ] Error logging is configured (without exposing sensitive data)
- [ ] Regular security updates for dependencies (`npm audit`)

## Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Rotate secrets regularly** - Change JWT_SECRET periodically
3. **Monitor rate limits** - Adjust if needed based on legitimate traffic
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use HTTPS in production** - Required for secure token transmission
6. **Review logs regularly** - Check for suspicious activity
7. **Implement monitoring** - Set up alerts for security events

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create public GitHub issues for security vulnerabilities.
