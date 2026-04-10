# Email Configuration Guide

## Overview

Email is critical for your apartment management system:
- ✅ Welcome emails for new members
- ✅ Password reset links
- ✅ Poll notifications
- ✅ Circular announcements
- ✅ Complaint status updates
- ✅ Maintenance reminders

---

## Gmail Setup (Recommended - Free)

### Step 1: Prepare Gmail Account

1. Go to https://myaccount.google.com
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled:
   - Search "2-Step Verification"
   - Click **Enable**
   - Follow verification steps
4. Go back to **Security**

### Step 2: Generate App Password

1. In Security page, search for **App passwords**
2. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your OS)
3. Google generates 16-character password
4. **Copy this password** — use it in Render, not your regular Gmail password

### Step 3: Add to Render Backend

1. Go to Render dashboard
2. Select `apartment-mgmt-backend` service
3. Click **Environment**
4. Add/update these variables:

```
MAIL_HOST              = smtp.gmail.com
MAIL_PORT              = 587
MAIL_USER              = your-email@gmail.com
MAIL_PASS              = [16-char password from Step 2]
MAIL_FROM              = no-reply@dabc-euphorbia.com
```

5. Click **Save** and service will redeploy

### Step 4: Test Email

1. Register a new test account on the app
2. Check your inbox for welcome email
3. If not received:
   - Check spam folder
   - Check app settings
   - Review backend logs in Render

---

## Alternative: SendGrid (More Reliable)

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up (free tier available)
3. Verify email

### Step 2: Create API Key

1. Click **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `apartment-mgmt`
4. Copy the key

### Step 3: Add to Render

1. Update backend environment variables:

```
MAIL_HOST              = smtp.sendgrid.net
MAIL_PORT              = 587
MAIL_USER              = apikey
MAIL_PASS              = [Your SendGrid API key]
MAIL_FROM              = your-verified-email@dabc.com
```

2. Save and redeploy

**Note**: You must verify sender email in SendGrid first

---

## Alternative: Mailgun (Professional)

### Setup

1. Go to https://www.mailgun.com
2. Sign up
3. Get SMTP credentials from dashboard
4. Add to Render environment

```
MAIL_HOST              = smtp.mailgun.org
MAIL_PORT              = 587
MAIL_USER              = [from Mailgun dashboard]
MAIL_PASS              = [from Mailgun dashboard]
MAIL_FROM              = your-verified-domain@dabc.com
```

---

## Email Templates

### Backend Email Templates

Located in: `backend/src/services/email.service.js`

Current templates:
- ✅ Welcome email
- ✅ Password reset
- ✅ Maintenance reminder
- ✅ Poll update
- ✅ Circular notification

### Customize Email Templates

To brand emails with association logo/colors:

1. Edit `backend/src/services/email.service.js`
2. Modify HTML templates
3. Add logo URL
4. Update styling
5. Commit and redeploy

Example:
```javascript
const htmlTemplate = `
  <div style="background-color: #001a4d; padding: 20px;">
    <img src="https://your-domain.com/logo.png" alt="DABC Logo">
    <h1 style="color: white;">DABC Euphorbia</h1>
    <p style="color: white;">Welcome to our community portal</p>
  </div>
`;
```

---

## Email Configuration Options

### Daily Maintenance Reminders

Enable emails for non-payment reminders:

1. Backend service → Environment
2. Add: `SEND_MAINTENANCE_REMINDERS = true`
3. Set: `MAINTENANCE_REMINDER_INTERVAL = monthly`

### Notification Frequency

Let users choose in profile settings:
- [ ] Immediate notifications
- [ ] Daily digest (once per day)
- [ ] Weekly digest (once per week)
- [ ] No emails (only in-app)

### From Address

Use a memorable sender email:
```
MAIL_FROM = "DABC Association" <accounts@dabc-euphorbia.com>
```

This is how emails appear in recipient inbox.

---

## Troubleshooting Email Issues

### Email Not Sending

**Check backend logs**:
1. Render dashboard → `apartment-mgmt-backend` → **Logs**
2. Search for "MAIL" or "SMTP"
3. Look for error messages

**Common Issues**:

| Error | Solution |
|-------|----------|
| "Authentication failed" | Wrong email/password. Use app password, not Gmail password |
| "Connection refused" | Wrong SMTP host. Use exact value (smtp.gmail.com) |
| "Port refused" | Try port 587 or 25 instead of 465 |
| "Timeout" | Firewall blocking. Contact hosting provider |

### Email Goes to Spam

**Solutions**:
1. Add sender to contacts/whitelist
2. Use custom domain email (not Gmail)
3. Improve email content (no spam trigger words)
4. Request email provider to whitelist your IP

### Recipient Not Receiving

**Check**:
1. Email address spelled correctly
2. Not on any blocklist
3. Email isn't in spam folder
4. Check backend logs for errors

---

## Best Practices

### Email Content

✅ **Do**:
- Use clear subject lines
- Keep emails brief
- Include action links
- Use company branding
- Add unsubscribe option (optional)

❌ **Don't**:
- Use ALL CAPS
- Send too frequently
- Make emails longer than needed
- Use misleading subject lines

### Sending Frequency

- Welcome: 1 per new member
- Password Reset: Only when requested
- Circulars: When published
- Polls: When created
- Reminders: Daily/weekly max
- Total: No more than 3 per week per member

### Email Security

✅ HTTPS encryption in transit
✅ Passwords stored encrypted
✅ No sensitive data in email body
✅ Links have expiry (reset links)
✅ Unsubscribe respected

---

## Monitoring Email

### Email Delivery Rate

Track in provider dashboard:
- Gmail: Check sending stats
- SendGrid: Dashboard → **Analytics**
- Mailgun: **Reporting** section

### Email Logs

In Render backend logs, you should see:
```
[EMAIL] Sending welcome email to member@email.com
[EMAIL] Email sent successfully (MessageID: xxxxx)
```

### Email Bounces

Bounced emails indicate:
- Invalid email address
- Inbox full
- Email provider rejecting

**Action**: Update member email or notify admin

---

## Cost Considerations

| Provider | Free Tier | Cost |
|----------|-----------|------|
| Gmail | 100/day | Free (requires 2FA) |
| SendGrid | 5,000/month | $0.10 per additional |
| Mailgun | 1,000/month | $0.50 per 1,000 |
| AWS SES | 62,000/month | $0.10 per 1,000 |

**Recommendation**: Start with Gmail free tier, upgrade to Mailgun for professional emails.

---

## Next Steps

1. [ ] Choose email provider (Gmail recommended)
2. [ ] Complete setup steps above
3. [ ] Update Render environment variables
4. [ ] Test by registering new account
5. [ ] Check email received
6. [ ] Monitor delivery rates
7. [ ] Customize email templates (optional)
8. [ ] Set up monitoring/logs

---

## Support

Email not working?
1. Check backend logs in Render
2. Review configuration variables
3. Test SMTP connection credentials
4. Contact email provider support
5. Email admin@dabc-euphorbia.com for help
