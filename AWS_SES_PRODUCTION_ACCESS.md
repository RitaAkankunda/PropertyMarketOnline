# AWS SES Production Access Request Guide

## What is Production Access?

In AWS SES **sandbox mode** (default), you can only send emails to:
- Verified email addresses
- Verified domains

**Production access** allows you to send emails to **any email address**, which is what you need for a real application.

---

## Step-by-Step: Request Production Access

### Step 1: Go to SES Account Dashboard

1. Open AWS Console: https://console.aws.amazon.com/
2. Make sure you're in **Europe (Ireland)** region (or your chosen region)
3. Search for "SES" in the top search bar
4. Click on **Amazon SES**
5. In the left sidebar, click **"Account dashboard"**

### Step 2: Request Production Access

1. On the Account dashboard page, you'll see a section about **"Sending limits"**
2. Look for a button or link that says:
   - **"Request production access"** or
   - **"Move out of the Amazon SES sandbox"** or
   - **"Request sending quota increase"**
3. Click on it

### Step 3: Fill Out the Request Form

You'll need to provide:

#### **Mail Type** (Select one):
- **Transactional** - For account notifications, password resets, order confirmations
- **Marketing** - For promotional emails, newsletters
- **Both** - For mixed use

**For your app, select: "Transactional"** (since you're sending verification emails)

#### **Website URL**:
- Enter your website URL (e.g., `https://propertymarket.com` or `http://localhost:3000` for development)
- If you don't have a live site yet, you can use a placeholder or your development URL

#### **Use Case Description** (Required):
Write a clear description, for example:

```
We are building a property marketplace platform (PropertyMarket Online) that connects property owners with service providers. We need to send transactional emails to users for:

1. Account verification requests
2. Verification status updates (approved/rejected)
3. Job notifications
4. Account security alerts

All emails are opt-in and users have registered accounts on our platform. We follow email best practices and include unsubscribe options where applicable.
```

#### **Expected Sending Volume**:
- **Daily volume**: Estimate how many emails per day (e.g., 100-500 for MVP, 1000+ for production)
- **Peak sending rate**: Emails per second (e.g., 5-10 for MVP)

#### **Compliance**:
- Check the box confirming you'll comply with AWS SES policies
- Confirm you have permission to send emails to your users

### Step 4: Submit the Request

1. Review all information
2. Click **"Submit"** or **"Request production access"**
3. You'll see a confirmation message

---

## What Happens Next?

### Timeline:
- **Usually approved within 24-48 hours**
- Sometimes faster (a few hours)
- Sometimes requires additional information

### AWS Review Process:
AWS will review your request and may:
1. **Approve immediately** - You'll get an email notification
2. **Request more information** - They'll email you with questions
3. **Deny** - Rare, usually if use case is unclear

### After Approval:
- You'll receive an email from AWS
- Your account will automatically move to production mode
- You can send emails to any address
- Your sending limits may increase

---

## What to Include in Your Request (Best Practices)

### ✅ Good Request Examples:

**Use Case:**
```
PropertyMarket Online is a property marketplace platform connecting property owners with verified service providers. We send transactional emails for:

- Account verification and KYC status updates
- Service request notifications
- Payment confirmations
- Security alerts

All recipients are registered users who have opted in during account creation. We implement proper unsubscribe mechanisms and follow CAN-SPAM compliance.
```

**Website URL:**
- Production: `https://propertymarket.com`
- Development: `http://localhost:3000` (if no live site yet)

**Volume:**
- Daily: 200-500 emails (for MVP)
- Peak rate: 5-10 emails/second

### ❌ Avoid:
- Vague descriptions like "sending emails"
- Mentioning spam or bulk marketing without context
- Unrealistic volume estimates

---

## Alternative: Verify More Emails (Quick Fix)

If you need to test immediately while waiting for production access:

1. Go to SES → Identities
2. Click "Create identity"
3. Verify each email address you need to test with
4. You can verify up to 10,000 email addresses in sandbox mode

---

## Checking Your Request Status

1. Go to SES → Account dashboard
2. Look for:
   - **"Sandbox"** status = Still in sandbox
   - **"Production"** status = Approved!
   - **"Pending"** = Under review

---

## After Production Access is Approved

### Update Your Code (Optional):
You don't need to change any code - it will automatically work with production access!

### Test It:
1. Submit a verification request
2. Check if email is received
3. Check backend logs for success message

### Monitor:
- Go to SES → Account dashboard
- Check your sending statistics
- Monitor bounce and complaint rates

---

## Troubleshooting

### Request Denied?
- Check your email for AWS's reason
- Usually they ask for clarification
- Resubmit with more details

### Still in Sandbox After Approval?
- Wait a few minutes (can take time to propagate)
- Check you're in the correct region
- Refresh the SES console

### Need Higher Limits?
- After production access, you can request quota increases
- Go to Account dashboard → Request sending quota increase

---

## Important Notes

1. **No Code Changes Needed**: Once approved, your existing code will work automatically
2. **Compliance**: Make sure you follow email best practices (unsubscribe links, etc.)
3. **Monitoring**: Keep an eye on bounce/complaint rates to maintain good sender reputation
4. **Cost**: Still very affordable - $0.10 per 1,000 emails after free tier

---

## Quick Checklist

- [ ] Go to SES → Account dashboard
- [ ] Click "Request production access"
- [ ] Fill out the form with:
  - [ ] Mail type: Transactional
  - [ ] Website URL
  - [ ] Use case description
  - [ ] Expected volume
- [ ] Submit request
- [ ] Wait for approval email (24-48 hours)
- [ ] Test sending emails after approval

---

**Need help?** Let me know if you get stuck on any step!

