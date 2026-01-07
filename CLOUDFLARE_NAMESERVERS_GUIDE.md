# How to Find and Update Nameservers

## Step 1: Find Cloudflare Nameservers

### In Cloudflare Dashboard:

1. **Go to your domain overview:**
   - Click on `propertymarketonline.com` in Cloudflare
   - You should see the domain overview page

2. **Look for "Nameservers" section:**
   - Usually at the top of the page
   - Or in the right sidebar
   - Shows 2 nameservers like:
     ```
     alice.ns.cloudflare.com
     bob.ns.cloudflare.com
     ```
   - Or might show as:
     ```
     Nameserver 1: alice.ns.cloudflare.com
     Nameserver 2: bob.ns.cloudflare.com
     ```

3. **If you don't see them:**
   - Look for a section called "Nameservers" or "DNS Nameservers"
   - Or check the "Overview" tab
   - They might be in a box that says "Update your nameservers"

**Copy both nameservers!**

---

## Step 2: Find Your Domain Registrar

**Where did you buy `propertymarketonline.com`?**

Check:
- Your email for purchase confirmation
- Your credit card statement
- Common places: Namecheap, GoDaddy, Google Domains, Cloudflare, etc.

---

## Step 3: Update Nameservers at Your Registrar

### If You Don't Know Your Registrar:

**Option 1: Check WHOIS**
1. Go to: https://whois.net
2. Enter: `propertymarketonline.com`
3. Look for "Registrar" - that's who you need to log into

**Option 2: Check Your Email**
- Search for "domain" or "propertymarketonline" in your email
- Look for purchase confirmation or renewal notices

---

## Common Registrars - Where to Update Nameservers

### Namecheap:
1. Log in to Namecheap
2. Go to: **Domain List**
3. Click **"Manage"** next to your domain
4. Go to **"Advanced DNS"** tab
5. Scroll to **"Nameservers"** section
6. Select **"Custom DNS"**
7. Paste Cloudflare nameservers
8. Click **"Save"**

### GoDaddy:
1. Log in to GoDaddy
2. Go to: **My Products** → **Domains**
3. Click on your domain
4. Scroll to **"Additional Settings"**
5. Click **"Manage DNS"** or **"Nameservers"**
6. Click **"Change"**
7. Select **"Custom"**
8. Paste Cloudflare nameservers
9. Click **"Save"**

### Google Domains / Squarespace:
1. Log in to Google Domains
2. Click on your domain
3. Go to **"DNS"** tab
4. Scroll to **"Name servers"**
5. Click **"Use custom name servers"**
6. Paste Cloudflare nameservers
7. Click **"Save"**

### Cloudflare (if you bought domain there):
- Nameservers are already set! Skip this step.

### Other Registrars:
- Look for: **"DNS Settings"**, **"Nameservers"**, or **"DNS Management"**
- Usually in domain settings or DNS section

---

## Step 4: Wait for Propagation

- Usually takes **5-15 minutes**
- Can take up to 24 hours (rare)
- Cloudflare will show when it's active

---

## Quick Checklist

- [ ] Find Cloudflare nameservers (in Cloudflare dashboard)
- [ ] Identify your domain registrar
- [ ] Log into your registrar
- [ ] Find "Nameservers" or "DNS Settings"
- [ ] Replace with Cloudflare nameservers
- [ ] Save changes
- [ ] Wait 5-15 minutes

---

## Need Help?

Tell me:
1. **Do you see the nameservers in Cloudflare?** (They should be visible on the domain overview)
2. **Which registrar did you buy the domain from?** (Check email or WHOIS)

I can give you exact step-by-step instructions for your specific registrar! 🚀

