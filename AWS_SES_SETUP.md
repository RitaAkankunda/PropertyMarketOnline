# AWS SES Email Setup Guide

This guide will help you set up AWS SES (Simple Email Service) for sending verification emails.

## 📋 Prerequisites

1. **AWS Account** - Sign up at [aws.amazon.com](https://aws.amazon.com)
2. **AWS SES Access** - SES is available in most AWS regions

## 🚀 Setup Steps

### 1. Install AWS SDK (Already included)

The `@aws-sdk/client-ses` package is already included in the project. If you need to install it manually:

```bash
cd backend
npm install @aws-sdk/client-ses
```

### 2. Configure AWS SES

#### Step 2.1: Verify Your Email Domain (Production)

For production, you need to verify your domain:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Click **Verified identities** → **Create identity**
3. Choose **Domain** and enter your domain (e.g., `propertymarket.com`)
4. Follow the DNS verification steps (add TXT and CNAME records)
5. Wait for verification (usually takes a few minutes to 24 hours)

#### Step 2.2: Verify Email Address (Development/Testing)

For development/testing, you can verify individual email addresses:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Click **Verified identities** → **Create identity**
3. Choose **Email address** and enter your email
4. Check your email and click the verification link
5. Your email is now verified

**⚠️ Important:** In SES sandbox mode (default), you can only send emails to verified addresses. To send to any email, request production access.

#### Step 2.3: Request Production Access (Optional)

To send emails to any address:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Click **Account dashboard**
3. Click **Request production access**
4. Fill out the form (use case, expected volume, etc.)
5. Wait for approval (usually 24-48 hours)

### 3. Create IAM User for SES

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Enter username: `ses-email-sender`
4. Select **Provide user access to the AWS Management Console** (optional)
5. Click **Next**
6. Under **Set permissions**, select **Attach policies directly**
7. Search for and select **AmazonSESFullAccess** (or create a custom policy with only `ses:SendEmail` permission)
8. Click **Next** → **Create user**
9. Click on the user → **Security credentials** tab
10. Click **Create access key**
11. Choose **Application running outside AWS**
12. Copy the **Access key ID** and **Secret access key** (you'll need these)

### 4. Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com  # Must be verified in SES
EMAIL_FROM_NAME=Property Market

# AWS SES Configuration
AWS_REGION=us-east-1  # Change to your preferred region (us-east-1, eu-west-1, etc.)
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**Important Notes:**
- `EMAIL_FROM` must be a verified email address or domain in SES
- `AWS_REGION` should match the region where you verified your email/domain
- Common regions: `us-east-1`, `us-west-2`, `eu-west-1`, `ap-southeast-1`

### 5. Test Email Sending

1. Start your backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Submit a verification request from the provider dashboard

3. Check the backend logs for email sending status:
   ```
   [EMAIL] Email sent successfully to user@example.com (MessageId: ...)
   ```

4. Check the recipient's inbox (and spam folder)

## 🔍 Troubleshooting

### Issue: "Email address is not verified"

**Solution:** Make sure the email address in `EMAIL_FROM` is verified in AWS SES.

### Issue: "The email address is not verified"

**Solution:** In sandbox mode, the recipient email must also be verified. Either:
- Verify the recipient email in SES, or
- Request production access

### Issue: "Access Denied"

**Solution:** Check that your IAM user has `ses:SendEmail` permission.

### Issue: "Invalid region"

**Solution:** Make sure `AWS_REGION` matches the region where you verified your email/domain.

### Issue: Emails going to spam

**Solutions:**
- Verify your domain (not just email) in SES
- Set up SPF, DKIM, and DMARC records
- Use a dedicated domain for sending emails
- Warm up your sending domain gradually

## 💰 Cost

AWS SES is very affordable:
- **Free tier:** 62,000 emails/month (if sent from EC2)
- **After free tier:** $0.10 per 1,000 emails
- **Data transfer:** Free (within AWS)

## 🔐 Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use IAM roles** - If deploying on AWS (EC2, Lambda, etc.)
3. **Rotate keys regularly** - Change access keys every 90 days
4. **Limit permissions** - Only grant `ses:SendEmail` permission
5. **Monitor usage** - Set up CloudWatch alarms for unusual activity

## 📚 Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)

## ✅ Verification Checklist

- [ ] AWS account created
- [ ] Email address or domain verified in SES
- [ ] IAM user created with SES permissions
- [ ] Access keys generated and saved securely
- [ ] Environment variables configured
- [ ] Test email sent successfully
- [ ] Production access requested (if needed)

