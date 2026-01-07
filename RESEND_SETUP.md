# Resend Setup Guide - Works for ALL Emails (Verified & Non-Verified)

## ✅ Why Resend?

**Resend works immediately for ALL emails** - both verified and non-verified addresses. No waiting for AWS approval, no email verification needed!

### Benefits:
- ✅ **Works immediately** - No verification needed
- ✅ **Works for all emails** - Verified and non-verified
- ✅ **Free tier** - 3,000 emails/month
- ✅ **Super easy setup** - 5 minutes
- ✅ **Great deliverability** - Professional service
- ✅ **Automatic fallback** - Falls back to AWS SES if Resend fails

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Resend Account

1. Go to: https://resend.com
2. Click **"Sign Up"** (free)
3. Sign up with your email
4. Verify your email address

### Step 2: Get API Key

1. After logging in, go to **"API Keys"** in the sidebar
2. Click **"Create API Key"**
3. Give it a name (e.g., "Property Market Production")
4. Select permissions: **"Sending access"**
5. Click **"Add"**
6. **Copy the API key** (you'll only see it once!)

### Step 3: Add to Environment Variables

Add to your `backend/.env` file:

```env
# Resend (works for all emails - verified and non-verified)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Property Market
EMAIL_ENABLED=true
```

**Important:** 
- Replace `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual API key
- For `EMAIL_FROM`, you can use any email (Resend doesn't require verification initially)
- Later, you can verify your domain for better deliverability

### Step 4: Restart Backend

```bash
cd backend
npm run start:dev
```

### Step 5: Test It!

1. Submit a verification request
2. Check if email arrives (check spam folder too)
3. Check backend logs for: `[EMAIL] Email sent successfully via Resend`

---

## 📧 How It Works

The system now uses a **smart fallback**:

1. **First:** Tries Resend (works for all emails)
2. **Fallback:** Uses AWS SES if Resend fails
3. **Final:** Logs to console if neither is configured

This means:
- ✅ Works for **verified emails** immediately
- ✅ Works for **non-verified emails** immediately
- ✅ Automatic fallback if one service fails
- ✅ No user action required

---

## 💰 Pricing

### Free Tier:
- **3,000 emails/month** - FREE forever
- Perfect for MVP and testing

### Paid Plans:
- **Pro:** $20/month for 50,000 emails
- **Business:** Custom pricing for higher volumes

**Compare to AWS SES:**
- AWS SES: Free for 62,000/month (if on EC2)
- Resend: Free for 3,000/month, then $20/month for 50,000

**For MVP/Startup:** Resend free tier is perfect!

---

## 🔧 Domain Verification (Optional but Recommended)

For better deliverability and to send from your own domain:

### Step 1: Verify Domain in Resend

1. Go to Resend Dashboard → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `propertymarket.com`)
4. Add the DNS records Resend provides:
   - **SPF record**
   - **DKIM records** (3 records)
   - **DMARC record** (optional)

### Step 2: Update Environment Variable

After verification, update `EMAIL_FROM`:

```env
EMAIL_FROM=noreply@yourdomain.com
```

### Step 3: Test

Send a test email - it should come from your domain!

---

## 🆚 Resend vs AWS SES

| Feature | Resend | AWS SES |
|---------|--------|---------|
| **Setup Time** | 5 minutes | 24-48 hours (approval) |
| **Works Immediately** | ✅ Yes | ❌ Needs approval |
| **Works for All Emails** | ✅ Yes | ❌ Only verified (sandbox) |
| **Free Tier** | 3,000/month | 62,000/month (EC2) |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost at Scale** | $20/50k | $5/50k |
| **Best For** | MVP, Startup | Enterprise, Scale |

**Recommendation:**
- **Start with Resend** (works immediately)
- **Switch to AWS SES** later if you need cost savings at scale

---

## 🔄 Current System Behavior

With Resend configured:

1. **Primary:** Resend sends emails (works for all addresses)
2. **Fallback:** If Resend fails, tries AWS SES
3. **Logging:** All attempts are logged

**Result:** Emails work for **both verified and non-verified** addresses immediately!

---

## ✅ Checklist

- [ ] Create Resend account
- [ ] Get API key
- [ ] Add `RESEND_API_KEY` to `.env`
- [ ] Restart backend
- [ ] Test email sending
- [ ] (Optional) Verify domain for better deliverability

---

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check API Key:**
   - Make sure `RESEND_API_KEY` is in `.env`
   - Restart backend after adding

2. **Check Logs:**
   - Look for `[EMAIL]` messages in backend logs
   - Check for error messages

3. **Check Resend Dashboard:**
   - Go to Resend → Logs
   - See if emails are being sent
   - Check for bounce/complaint rates

### Emails Going to Spam?

1. **Verify your domain** (see Domain Verification above)
2. **Use a professional from address** (`noreply@yourdomain.com`)
3. **Avoid spam trigger words** in subject lines
4. **Include plain text version** (already done ✅)

---

## 📚 Next Steps

1. **Immediate:** Add Resend API key and test
2. **Short-term:** Verify your domain for better deliverability
3. **Long-term:** Consider AWS SES if you need cost savings at scale

---

## 🎉 That's It!

You now have a system that works for **all emails** (verified and non-verified) immediately!

**No waiting, no verification needed, just works!** 🚀

