# Complete AWS SES Setup Guide - Step by Step

## ✅ Step 1: Verify Your Email (You're doing this now)

1. Go to SES Console → Identities → Create identity
2. Select "Email address"
3. Enter your email: `akankundarita04@gmail.com`
4. Click "Create identity"
5. Check your email and click the verification link
6. Confirm it shows "Verified" in SES → Identities

---

## 🔐 Step 2: Create IAM User for SES

### 2.1 Go to IAM Console

1. In the AWS Console top search bar, type: **IAM**
2. Click on **IAM** (Identity and Access Management)
3. You should see the IAM dashboard

### 2.2 Create New User

1. In the left sidebar, click **"Users"**
2. Click the orange **"Create user"** button (top right)
3. **User name:** Enter: `ses-email-sender`
4. Click **"Next"**

### 2.3 Set Permissions

1. Under **"Set permissions"**, you'll see options
2. Select **"Attach policies directly"**
3. In the search box, type: `SES`
4. Check the box next to **"AmazonSESFullAccess"**
   - (This gives full SES permissions - you can create a custom policy later with only `ses:SendEmail` if you want more security)
5. Click **"Next"**

### 2.4 Review and Create

1. Review the user details
2. Click **"Create user"**
3. You should see a success message

---

## 🔑 Step 3: Get Access Keys

### 3.1 Open the User

1. You should be on the "User created successfully" page
2. Click on the user name: **"ses-email-sender"**
   - OR go to Users list and click on "ses-email-sender"

### 3.2 Create Access Key

1. Click the **"Security credentials"** tab
2. Scroll down to **"Access keys"** section
3. Click **"Create access key"**

### 3.3 Choose Use Case

1. Select: **"Application running outside AWS"**
2. Check the confirmation box
3. Click **"Next"**

### 3.4 Get Your Keys

1. You'll see:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (long string)
2. **⚠️ IMPORTANT:** Copy both keys NOW - you won't see the secret key again!
3. Click **"Done"**

### 3.5 Save Your Keys Securely

Save these somewhere safe (password manager, secure note):
```
Access Key ID: AKIA...
Secret Access Key: ...
```

---

## 📝 Step 4: Add to .env File

### 4.1 Open Your .env File

1. Go to your project: `backend/.env`
2. Open it in your code editor

### 4.2 Add These Lines

Add these at the end of your `.env` file:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_FROM=akankundarita04@gmail.com
EMAIL_FROM_NAME=Property Market

# AWS SES Configuration
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### 4.3 Replace the Values

- Replace `your_access_key_id_here` with your actual Access Key ID
- Replace `your_secret_access_key_here` with your actual Secret Access Key
- Keep `EMAIL_FROM=akankundarita04@gmail.com` (your verified email)
- Keep `AWS_REGION=eu-west-1` (Europe Ireland)

### 4.4 Save the File

Save the `.env` file (make sure it's in `backend/.env`)

---

## 🧪 Step 5: Test Email Sending

### 5.1 Start Your Backend

```bash
cd backend
npm run start:dev
```

### 5.2 Submit a Verification Request

1. Go to your frontend
2. Log in as a service provider
3. Go to Provider Dashboard → Verification tab
4. Upload an ID document
5. Click "Submit Verification Request"

### 5.3 Check the Logs

In your backend terminal, you should see:
```
[EMAIL] Email sent successfully to akankundarita04@gmail.com (MessageId: ...)
```

### 5.4 Check Your Email

- Check your inbox: `akankundarita04@gmail.com`
- You should receive a verification request confirmation email
- Subject: "Verification Request Submitted"

---

## ✅ Verification Checklist

- [ ] Email verified in SES (shows "Verified" status)
- [ ] IAM user created (`ses-email-sender`)
- [ ] Access keys created and saved
- [ ] `.env` file updated with credentials
- [ ] Backend restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox

---

## 🐛 Troubleshooting

### Issue: "Email address is not verified"
- Make sure your email shows "Verified" in SES → Identities
- Check you're in the correct region (Europe Ireland)

### Issue: "Access Denied"
- Check IAM user has `AmazonSESFullAccess` policy
- Verify access keys are correct in `.env`

### Issue: "Invalid region"
- Make sure `AWS_REGION=eu-west-1` in `.env`
- Check SES console is in Europe (Ireland) region

### Issue: Email not received
- Check spam folder
- Verify `EMAIL_FROM` matches your verified email
- Check backend logs for errors

---

## 🔒 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Rotate keys regularly** - Change every 90 days
3. **Use IAM roles** - If deploying on AWS (EC2, Lambda)
4. **Monitor usage** - Check AWS CloudWatch for unusual activity

---

## 📚 Next Steps

Once emails are working:
- Request production access in SES (to send to any email)
- Set up email templates for better formatting
- Configure bounce/complaint handling
- Set up email analytics

---

**Need help?** Let me know which step you're on and I'll guide you through it!

