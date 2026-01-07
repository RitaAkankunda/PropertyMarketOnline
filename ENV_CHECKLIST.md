# .env File Checklist for Email Setup

## 🎯 Recommended: Resend (Works for ALL Emails)

Make sure your `backend/.env` file has these variables:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Property Market

# Resend (Primary - Works for ALL emails, verified and non-verified)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS SES (Optional - Fallback)
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

## ✅ Verification Checklist

### Required (Resend - Works Immediately):
- [ ] `RESEND_API_KEY=re_...` (Get from https://resend.com - see RESEND_SETUP.md)
- [ ] `EMAIL_ENABLED=true`
- [ ] `EMAIL_FROM=noreply@yourdomain.com` (or any email)
- [ ] `EMAIL_FROM_NAME=Property Market`

### Optional (AWS SES - Fallback):
- [ ] `AWS_REGION=eu-west-1` (if using AWS SES)
- [ ] `AWS_ACCESS_KEY_ID=...` (if using AWS SES)
- [ ] `AWS_SECRET_ACCESS_KEY=...` (if using AWS SES)

**Note:** Resend works for ALL emails immediately. AWS SES is optional fallback.

## 🧪 Next: Test It!

1. **Restart your backend server:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Submit a verification request:**
   - Go to your frontend
   - Log in as a service provider
   - Go to Provider Dashboard → Verification tab
   - Upload an ID document
   - Click "Submit Verification Request"

3. **Check the logs:**
   You should see:
   ```
   [EMAIL] Email sent successfully to akankundarita04@gmail.com (MessageId: ...)
   ```

4. **Check your email:**
   - Check inbox: `akankundarita04@gmail.com`
   - You should receive a "Verification Request Submitted" email

## 🐛 If It Doesn't Work

- Make sure backend server is restarted (to load new .env variables)
- Check backend logs for errors
- Verify email is "Verified" in SES Console
- Check you're in the correct region (Europe Ireland)

