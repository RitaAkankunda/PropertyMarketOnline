# Resend Domain Verification - Quick Fix

## The Issue

Resend is currently in "testing mode" which means:
- ✅ Can send to your verified email: `akankundarita04@gmail.com`
- ❌ Cannot send to other emails (like `joykyom@gmail.com`)

**Error message:**
```
You can only send testing emails to your own email address (akankundarita04@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains
```

## The Solution: Verify Your Domain (5 Minutes)

### Step 1: Go to Resend Domains

1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain: `propertymarket.com` (or any domain you own)
4. Click **"Add"**

### Step 2: Add DNS Records

Resend will show you DNS records to add. You need to add:

1. **SPF Record** (TXT record)
2. **DKIM Records** (3 TXT records)
3. **DMARC Record** (optional, but recommended)

**Where to add:**
- Go to your domain registrar (where you bought the domain)
- Find DNS settings
- Add the TXT records Resend provides
- Save

### Step 3: Wait for Verification

- Usually takes **5-15 minutes**
- Resend will automatically verify when DNS records are detected
- You'll see "Verified" status in Resend dashboard

### Step 4: Update Environment Variable

After verification, update your `backend/.env`:

```env
EMAIL_FROM=noreply@propertymarket.com
```

(Use your verified domain)

### Step 5: Restart Backend

```bash
cd backend
npm run start:dev
```

## After Verification

✅ Can send to **ANY email address**  
✅ Works for verified and non-verified emails  
✅ Professional sender address  
✅ Better deliverability  

## Alternative: Use a Subdomain

If you don't want to use your main domain, you can use a subdomain:

1. Add domain: `mail.propertymarket.com` (or `email.propertymarket.com`)
2. Add DNS records for the subdomain
3. Update `EMAIL_FROM=noreply@mail.propertymarket.com`

## Quick Test

After verification, try sending a verification request again. You should see:

```
[EMAIL] Email sent successfully via Resend to joykyom@gmail.com (ID: ...)
```

## Don't Have a Domain?

If you don't have a domain yet:
1. **Option 1:** Buy a domain (e.g., from Namecheap, GoDaddy) - $10-15/year
2. **Option 2:** Use AWS SES production access (takes 24-48 hours)
3. **Option 3:** Use SendGrid (easier setup, but costs more)

## Why This is Better Than AWS SES

- ✅ **Faster:** 5-15 minutes vs 24-48 hours
- ✅ **Easier:** Just add DNS records
- ✅ **Works immediately** after verification
- ✅ **Better for MVP:** Free tier is generous

---

**This is the quickest way to get emails working for all users!** 🚀

