# Find Your Registrar & Update Nameservers

## Step 1: Find Your Registrar Using ICANN Lookup

1. **Go to:** https://lookup.icann.org
2. **Enter:** `propertymarketonline.com`
3. **Click "Lookup"**
4. **Look for "Registrar"** in the results
   - This tells you who manages your domain

---

## Step 2: Identify If It's a Reseller

**Common Resellers (not actual registrars):**
- **Squarespace** - If you bought domain through Squarespace website builder
- **Wix** - If you bought domain through Wix
- **WordPress.com** - If you bought through WordPress
- **Shopify** - If you bought through Shopify

**If it's a reseller:**
- Update nameservers in the reseller platform (not the actual registrar)
- Example: If Squarespace, update in Squarespace dashboard

---

## Step 3: Update Nameservers

### Your Cloudflare Nameservers (Copy These):
```
lola.ns.cloudflare.com
zahir.ns.cloudflare.com
```

### Where to Update:

#### If Registrar is Namecheap:
1. Log in to Namecheap
2. Domain List → Manage → Advanced DNS
3. Nameservers section → Custom DNS
4. Paste Cloudflare nameservers
5. Save

#### If Registrar is GoDaddy:
1. Log in to GoDaddy
2. My Products → Domains
3. Click your domain
4. Nameservers → Change
5. Custom → Paste Cloudflare nameservers
6. Save

#### If Reseller is Squarespace:
1. Log in to Squarespace
2. Settings → Domains
3. Click your domain
4. DNS Settings → Nameservers
5. Update to Cloudflare nameservers
6. Save

#### If Registrar is Google Domains:
1. Log in to Google Domains
2. Click your domain
3. DNS → Name servers
4. Use custom name servers
5. Paste Cloudflare nameservers
6. Save

---

## Step 4: Wait for Propagation

- Usually 5-15 minutes
- Cloudflare will show when active
- DNS changes propagate globally

---

## Step 5: Verify in Resend

After nameservers are updated:
1. Go to Resend → Domains
2. Click "I've added the records"
3. Resend will verify automatically
4. Should see "Verified" status

---

## Quick Action Plan

1. ✅ Go to https://lookup.icann.org
2. ✅ Enter `propertymarketonline.com`
3. ✅ Find "Registrar" in results
4. ✅ Tell me the registrar name
5. ✅ I'll give you exact steps to update nameservers

---

**Go to ICANN Lookup now and tell me what registrar it shows!** 🚀

