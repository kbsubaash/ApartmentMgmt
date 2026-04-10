# Custom Domain Setup Guide

## Overview

Instead of users accessing `https://apartment-mgmt-frontend.onrender.com`, they can use a professional domain like `https://dabc-euphorbia.com`.

---

## Step 1: Register a Domain (If Needed)

### Where to Buy

Popular domain registrars:
- [GoDaddy.com](https://godaddy.com) — Popular, good support
- [Namecheap.com](https://namecheap.com) — Affordable
- [Vercel Domains](https://vercel.com/domains) — Integrated with hosting
- [Google Domains](https://domains.google) — Simple interface
- [AWS Route 53](https://aws.amazon.com/route53/) — Professional

### Recommended Domain Names

For apartment association:
- `dabc-euphorbia.com`
- `apartment.dabc-euphorbia.com`
- `portal.dabc.com`
- `community.dabc.com`

### Cost

Typical: $10-15/year (first year, renewal may vary)

### Registration Steps

1. Go to registrar website
2. Search for domain
3. Check availability
4. Add to cart
5. Complete registration
6. Keep login credentials safe

---

## Step 2: Add Custom Domain to Render

### For Frontend (dabc-euphorbia.com)

1. Go to Render dashboard
2. Click `apartment-mgmt-backend` service
3. Click **Settings** tab
4. Scroll to **Custom Domains**
5. Click **Add Custom Domain**
6. Enter: `dabc-euphorbia.com`
7. Click **Add Domain**

Render generates DNS records (you'll need these in Step 3)

### For Backend (api.dabc-euphorbia.com) - Optional

If you want a custom backend URL:

1. In same service settings
2. Add custom domain: `api.dabc-euphorbia.com`
3. Note the DNS records
4. Later: Update frontend `VITE_API_URL` environment variable to use this domain

---

## Step 3: Configure DNS Records

### Get DNS Records from Render

After adding custom domain, Render shows DNS records like:

```
Type: CNAME
Name: dabc-euphorbia.com
Value: apartment-mgmt-frontend-xxxx.onrender.com
TTL: 3600
```

### Go to Domain Registrar

Example using GoDaddy:

1. Log into GoDaddy account
2. Go to **My Domains**
3. Click your domain: `dabc-euphorbia.com`
4. Click **Manage DNS** or **DNS Records**
5. You'll see existing records (likely including A records)

### Add/Update DNS Records

**Option A: Using CNAME (Recommended)**

1. Look for CNAME records section
2. Add new record:
   - **Type**: CNAME
   - **Name**: (leave blank or @)
   - **Points to**: apartment-mgmt-frontend-xxxx.onrender.com
   - **TTL**: 3600
3. Save

**Option B: Using A Record (If CNAME blocked)**

1. Get Render's IP address: `nslookup apartment-mgmt-frontend-xxxx.onrender.com`
2. Add A record:
   - **Type**: A
   - **Name**: @ (or blank)
   - **Value**: [IP address]
   - **TTL**: 3600
3. Save

### Wait for DNS Propagation

DNS can take 15 minutes to 48 hours, usually:
- ✅ 5-15 minutes: Often works
- ✅ 1 hour: Almost always works
- ✅ 24 hours: Guaranteed

**Check progress**:
```bash
# In terminal, run:
nslookup dabc-euphorbia.com

# Or use online tool: https://dnschecker.org/
```

Should return Render's IP address.

---

## Step 4: Verify Domain Setup

### In Render Dashboard

1. Go to frontend service
2. **Settings** → **Custom Domains**
3. Check domain status:
   - 🟢 **Active** — Domain working
   - 🟡 **Pending** — DNS propagating
   - 🔴 **Error** — Check DNS records

### Test in Browser

Once active (green):

1. Open browser
2. Go to: `https://dabc-euphorbia.com`
3. Should load frontend
4. Check SSL certificate (lock icon)
5. Try logging in to verify it works

### SSL Certificate

✅ Render auto-provisions free SSL via Let's Encrypt
❌ Takes 5-10 minutes after domain is active
✅ Auto-renewal handled by Render
⚠️ HTTP automatically redirects to HTTPS

---

## Step 5: Update Frontend API Configuration (Optional)

If you also set up backend custom domain:

1. Render dashboard → `apartment-mgmt-frontend` service
2. **Environment** tab
3. Update `VITE_API_URL`:

```
Before: https://apartment-mgmt-backend.onrender.com/api
After:  https://api.dabc-euphorbia.com/api
```

4. Save → Frontend redeploys

---

## Email Domain (Advanced)

### Use Custom Domain for Emails

Instead of emails coming from `noreply@gmail.com`, send from `noreply@dabc-euphorbia.com`:

1. Add SPF record to DNS:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:sendmail.sendgrid.net ~all
   ```

2. Add DKIM record (provide by email service)

3. Update `MAIL_FROM` in Render:
   ```
   MAIL_FROM = support@dabc-euphorbia.com
   ```

4. Verify sender email in email service

---

## DNS Records Quick Reference

### Required Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | apartment-mgmt-frontend-xxxx.onrender.com | 3600 |

### Optional Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| MX | @ | mail.dabc-euphorbia.com | Email routing |
| TXT | @ | v=spf1 ... | Email authentication |
| CNAME | api | apartment-mgmt-backend-xxxx.onrender.com | Backend API |
| CNAME | mail | mail.dabc-euphorbia.com | Email service |

---

## Troubleshooting

### Domain Shows "Error" in Render

**Common Causes**:
1. DNS records not added correctly
2. Wrong record type
3. DNS hasn't propagated yet

**Solutions**:
1. Double-check DNS records match Render's requirement
2. Wait 1 hour for DNS propagation
3. Try different DNS record type (A instead of CNAME)
4. Check registrar documentation for their DNS interface

### SSL Certificate Not Issued

**Common Causes**:
1. DNS not yet resolved
2. Render can't verify domain

**Solutions**:
1. Wait 10 minutes
2. Check DNS is correctly set
3. Clear browser cache
4. Try different browser
5. Contact Render support

### Can't Access Domain

**Check**:
1. DNS records added: `nslookup dabc-euphorbia.com`
2. Should return Render's IP
3. Check Render service status
4. Check service **Settings** → Custom Domain shows green ✅

### Email from Custom Domain Not Recognized

**Check**:
1. SPF record added
2. DKIM record added
3. Email provider verified domain
4. Wait 24 hours for email providers to recognize

### Performance Issues with Custom Domain

**Unlikely**, but if slow:
1. DNS TTL too high (lower to 300)
2. CDN cache issue (clear browser cache)
3. Render service issue (check metrics)

---

## Subdomain Examples

### Two-Service Setup

| Service | Domain |
|---------|--------|
| Frontend | `dabc-euphorbia.com` or `app.dabc-euphorbia.com` |
| Backend | `api.dabc-euphorbia.com` |

### Multi-Environment Setup

| Environment | Domain |
|-------------|--------|
| Production | `dabc-euphorbia.com` |
| Staging | `staging.dabc-euphorbia.com` |
| Development | Dev on localhost only |

---

## Domain Renewal

### Auto-Renewal

Most registrars offer auto-renewal:
1. Go to registrar → **Domain Settings**
2. Enable **Auto-Renewal**
3. Credit card will be charged annually
4. ✅ Domain stays active

### Manual Renewal

If auto-renewal disabled:
1. Check domain expiration date
2. Renew 30 days before expiration
3. Pay renewal fee
4. Domain extends 1 more year

### Expired Domain

If domain expires:
1. Grace period: Usually 30 days
2. Can still renew within grace period
3. After grace: Goes back to open registration
4. Someone else could register it

---

## Best Practices

✅ **Do**:
- Use professional domain name
- Enable auto-renewal
- Keep registrar account secure
- Use strong password
- Enable 2FA on registrar account
- Monitor expiration date

❌ **Don't**:
- Let domain expire
- Use generic domain
- Share registrar login
- Forget to renew

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Domain | $10-15 | Yearly |
| SSL Certificate | $0 | Free (Let's Encrypt) |
| Custom setup | $0 | One-time |
| **Total** | **$10-15** | **Per Year** |

**Professional domain makes system appear reliable and official.**

---

## Next Steps

1. [ ] Decide on domain name
2. [ ] Search availability
3. [ ] Register with preferred registrar
4. [ ] Add domain in Render
5. [ ] Copy DNS records from Render
6. [ ] Add DNS records in registrar
7. [ ] Wait for DNS propagation (5-48h)
8. [ ] Verify domain is active (green in Render)
9. [ ] Test by visiting domain
10. [ ] Update user documentation with new URL

---

## Reference Links

- Render Custom Domains: https://render.com/docs/custom-domains
- Domain Registrars:
  - GoDaddy: https://godaddy.com
  - Namecheap: https://namecheap.com
  - Google Domains: https://domains.google
- DNS Checker: https://dnschecker.org/
- SSL Status: https://www.sslshopper.com/ssl-checker.html

---

## Support

Domain issues?
1. Check Render documentation
2. Check registrar documentation
3. Use DNS checker tool
4. Wait longer for propagation
5. Contact registrar support
6. Contact Render support

---

**With a custom domain, your apartment management system looks professional and official!**
