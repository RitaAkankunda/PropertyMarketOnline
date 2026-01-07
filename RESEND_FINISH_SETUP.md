# Finish Resend Setup - Step by Step

## You're Almost There! 🎯

You're on the Resend domain setup page. Here's exactly what to do:

---

## Step 1: Copy the DNS Records

On the Resend page, you need to copy these records:

### 1. Domain Verification (DKIM) - REQUIRED
- **Type:** `TXT`
- **Name:** `resend._domainkey`
- **Content:** (the long key - copy the full value)
- **TTL:** `Auto`

### 2. Enable Sending (SPF) - REQUIRED
- **Type:** `TXT`
- **Name:** `send`
- **Content:** `v=spf1 include:amazons...` (copy the full value)
- **TTL:** `Auto`

### 3. DMARC (Optional but Recommended)
- **Type:** `TXT`
- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none;`
- **TTL:** `Auto`

---

## Step 2: Find Your Domain Provider

Where did you buy `propertymarketonline.com`?

**Common providers:**
- **Namecheap** → Account → Domain List → Manage → Advanced DNS
- **GoDaddy** → My Products → DNS → Manage DNS
- **Cloudflare** → Select domain → DNS → Records
- **Google Domains** → DNS → Custom records
- **Name.com** → Domains → Manage → DNS Records

**Don't know?** Check your email for purchase confirmation or check WHOIS.

---

## Step 3: Add DNS Records

### For Each Record:

1. Click **"Add Record"** or **"Create Record"**
2. Select **Type:** `TXT`
3. Enter **Name/Host:** (exactly as shown in Resend)
   - `resend._domainkey` (for DKIM)
   - `send` (for SPF)
   - `_dmarc` (for DMARC)
4. Enter **Value/Content:** (copy exactly from Resend)
5. Set **TTL:** `Auto` or `3600` (1 hour)
6. Click **"Save"** or **"Add Record"**

### Important Notes:
- ✅ Copy the **exact** values from Resend
- ✅ Don't add quotes around the content
- ✅ Add all 3 records (DKIM, SPF, DMARC)
- ✅ Save each record after adding

---

## Step 4: Wait for DNS Propagation

- Usually takes **5-15 minutes**
- Can take up to 24 hours (rare)
- Resend checks automatically

**How to check:**
- Go back to Resend → Domains
- You'll see "Pending" → "Verified" when ready

---

## Step 5: Click "I've added the records"

After adding all DNS records:
1. Go back to the Resend page
2. Click the **"I've added the records"** button
3. Resend will start checking automatically

---

## Step 6: Update Your Environment

Once verified, update `backend/.env`:

```env
EMAIL_FROM=noreply@propertymarketonline.com
EMAIL_FROM_NAME=Property Market
EMAIL_ENABLED=true
RESEND_API_KEY=re_csf1S5jb_5GTgKK7qmAvJCBWVRgJ7k7qB
```

---

## Step 7: Restart Backend

```bash
cd backend
npm run start:dev
```

---

## Step 8: Test It!

1. Submit a verification request
2. Check backend logs - should see:
   ```
   [EMAIL] Email sent successfully via Resend to joykyom@gmail.com (ID: ...)
   ```
3. Check the recipient's email inbox

---

## Troubleshooting

### DNS Records Not Showing?
- Wait 5-10 minutes (DNS propagation takes time)
- Check you added them correctly
- Make sure you saved each record

### Still "Pending" After 30 Minutes?
- Double-check DNS records are correct
- Verify you added them to the right domain
- Check for typos in the content

### Need Help Finding DNS Settings?
Tell me your domain provider and I'll give specific instructions!

---

## After Verification ✅

- ✅ Can send to **ANY email address**
- ✅ Works for verified and non-verified emails
- ✅ Professional sender: `noreply@propertymarketonline.com`
- ✅ Better deliverability
- ✅ Free tier: 3,000 emails/month

---

## Quick Checklist

- [ ] Copy DNS records from Resend
- [ ] Find domain provider
- [ ] Add DKIM record (`resend._domainkey`)
- [ ] Add SPF record (`send`)
- [ ] Add DMARC record (`_dmarc`)
- [ ] Click "I've added the records" in Resend
- [ ] Wait for verification (5-15 minutes)
- [ ] Update `EMAIL_FROM` in `.env`
- [ ] Restart backend
- [ ] Test sending an email

---

**You're almost done! Just add those DNS records and you'll be sending emails in 15 minutes!** 🚀

