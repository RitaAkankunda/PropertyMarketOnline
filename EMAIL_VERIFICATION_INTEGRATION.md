m # Email Verification System - Integration Guide

## Overview
This document provides integration instructions for the complete email verification system implemented in the Property Market application.

## Files Created/Modified

### Backend Files
```
backend/
├── src/
│   ├── common/
│   │   ├── email-validation.service.ts (NEW)
│   │   ├── email-verification.service.ts (NEW)
│   │   ├── email.service.ts (UPDATED - added sendVerificationEmail)
│   ├── auth/
│   │   ├── auth.service.ts (UPDATED - validates email, sends verification)
│   │   ├── auth.controller.ts (UPDATED - added verification endpoints)
│   │   ├── auth.module.ts (UPDATED - added email services)
│   ├── users/
│   │   ├── entities/user.entity.ts (UPDATED - added email verification fields)
│   ├── migrations/
│   │   └── 033-add-email-verification.ts (NEW - database schema update)
├── EMAIL_VERIFICATION_IMPLEMENTATION.md (NEW)
```

### Frontend Files
```
frontend/property-market/src/
├── app/
│   ├── auth/
│   │   ├── verify-email/page.tsx (NEW)
│   │   ├── resend-verification/page.tsx (NEW)
├── components/
│   ├── auth/
│   │   └── EmailVerificationPending.tsx (NEW)
├── services/
│   └── auth.service.ts (UPDATED - email verification methods)
```

## Database Migration

Run the migration to add new columns:

```bash
cd backend
npm run migration:run
```

This adds:
- `emailVerificationToken` - Stores verification token
- `emailVerificationTokenExpires` - Token expiration
- `emailVerifiedAt` - Verification timestamp
- `isEmailVerified` - Verification status
- `emailVerificationAttempts` - Failed attempt count

## Backend Configuration

Update `.env.backend`:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_FROM=noreply@propertymarket.com
EMAIL_FROM_NAME=Property Market
APP_URL=http://localhost:3002

# Email Provider (choose one)
# Option 1: Resend (recommended for development)
RESEND_API_KEY=your_resend_api_key

# Option 2: AWS SES (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

## Key Features

### 1. Email Validation
- **Format Check**: RFC 5322 compliant validation
- **Disposable Domain Detection**: 200+ temporary email providers blocked
- **Whitelisted Providers**: Known legitimate email services allowed

Blocked domains include:
- mailinator.com, tempmail.com, 10minutemail.com
- guerrillamail.com, yopmail.com, throwaway.email
- And 195+ others

### 2. Email Verification Flow

**Step 1: User Registration**
```bash
POST /auth/signup
{
  "email": "user@gmail.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token_here",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false
  },
  "requiresEmailVerification": true,
  "message": "Account created successfully. Please check your email to verify your address."
}
```

**Step 2: User Clicks Email Link**
- Email contains verification link: `https://frontend/auth/verify-email?token=xxx&email=user@gmail.com`
- User clicks link → frontend calls verification endpoint

**Step 3: Email Verification**
```bash
POST /auth/verify-email?token=TOKEN&email=user@gmail.com
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": true
  }
}
```

### 3. Resend Verification Email

Users can request a new verification email:

```bash
POST /auth/resend-verification-email
{
  "email": "user@gmail.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

### 4. Check Verification Status

```bash
POST /auth/verification-status
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "verified": true,
  "lastSentAt": "2025-01-21T10:30:00Z",
  "nextResendAvailable": null
}
```

## Frontend Integration

### 1. Update Registration Page

Import the email validation component in your registration page:

```typescript
import { EmailVerificationPending } from '@/components/auth/EmailVerificationPending';

// After successful registration, check if email verification is required:
const handleRegisterSuccess = (response: any) => {
  if (response.requiresEmailVerification) {
    // Show pending verification UI
    return <EmailVerificationPending email={response.user.email} userId={response.user.id} />;
  }
  
  // Or redirect to verification page
  router.push(`/auth/verify-email?email=${response.user.email}`);
};
```

### 2. Email Verification Pages

**Verify Email Page** (`/auth/verify-email`)
- Shows loading state while verifying
- Displays success or error
- Auto-redirects to dashboard on success
- Provides option to request new email on failure

**Resend Verification Page** (`/auth/resend-verification`)
- Input field for user's email
- Send button with loading state
- Confirmation message after sending

### 3. Email Verification Pending Component

Use in dashboard/protected pages for unverified users:

```typescript
import { EmailVerificationPending } from '@/components/auth/EmailVerificationPending';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user?.isEmailVerified) {
    return <EmailVerificationPending email={user?.email} userId={user?.id} />;
  }
  
  // Dashboard content
}
```

## Error Handling

### Frontend Error Messages

| Error | Message | Action |
|-------|---------|--------|
| Invalid email format | "Please enter a valid email address" | Show input validation |
| Disposable email | "Disposable emails not allowed. Use a real email provider." | Suggest Gmail/Outlook |
| Token expired | "Verification link expired. Request a new one." | Show resend button |
| Too many attempts | "Too many attempts. Contact support." | Show support link |
| Email already verified | "Email is already verified" | Redirect to login |

### Backend Validation

Email validation happens at:
1. **Registration** - In `auth.service.signUp()`
2. **Provider Registration** - In `providers.service.registerProviderComplete()`
3. **Email Verification** - In `email-verification.service.verifyEmailWithToken()`

## Security Considerations

### 1. Token Security
- Tokens are 32+ character random strings
- 24-hour expiration window
- Stored hashed in database (not plain text)
- One-time use (cleared after verification)

### 2. Rate Limiting
- Max 5 failed verification attempts per user
- After limit, user must contact support
- Counter resets on successful verification

### 3. Domain Validation
- Blocks disposable/temporary email services
- Prevents fake registrations
- Whitelist can be customized

### 4. Email Verification
- Sent immediately after registration
- User must click unique link
- Link includes timestamp for expiration

## Testing

### Test Cases

**Test 1: Valid Email Registration**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }'
```
✅ Should: Send verification email, return requiresEmailVerification: true

**Test 2: Disposable Email (Should Fail)**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@mailinator.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }'
```
❌ Should: Reject with 400 "Disposable email not allowed"

**Test 3: Invalid Email Format (Should Fail)**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }'
```
❌ Should: Reject with 400 "Invalid email format"

**Test 4: Email Verification**
```bash
# Get token from verification email or database
curl -X POST "http://localhost:3000/auth/verify-email?token=abc123&email=user@gmail.com"
```
✅ Should: Mark email as verified, return user with isEmailVerified: true

## Deployment Checklist

- [ ] Configure email provider (Resend or AWS SES)
- [ ] Set EMAIL_ENABLED=true in production
- [ ] Set APP_URL to production frontend URL
- [ ] Run database migration on production
- [ ] Test email sending with real emails
- [ ] Configure email footer/branding
- [ ] Set up monitoring for email delivery failures
- [ ] Create support documentation for users
- [ ] Test verification flow end-to-end
- [ ] Set up retry mechanism for failed emails
- [ ] Configure scheduled job to clean expired tokens (optional)

## Troubleshooting

### Verification emails not sending
1. Check EMAIL_ENABLED=true in .env
2. Verify email provider credentials (Resend API key or AWS SES)
3. Check server logs for email service errors
4. Ensure APP_URL is correctly set

### Verification links not working
1. Confirm token format in database
2. Check link expiration (24 hours)
3. Verify frontend URL matches APP_URL
4. Check query parameters (token and email)

### Users can't resend email
1. Check email verification attempts counter
2. Max attempts is 5 (can be modified in service)
3. Suggest user contact support if exceeded

## Future Enhancements

1. **SMS Verification**: Add SMS as verification method
2. **One-Time Codes**: 6-digit codes instead of links
3. **Multiple Methods**: Email + SMS for extra security
4. **Verification Badge**: Show on verified user profiles
5. **Email Change Re-verification**: Require verification when changing email
6. **Auto-cleanup**: Scheduled job to delete expired tokens
7. **Webhook Support**: Integrate with third-party email services
8. **Custom Templates**: Allow custom email templates

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify email provider configuration
4. Contact development team with error messages
