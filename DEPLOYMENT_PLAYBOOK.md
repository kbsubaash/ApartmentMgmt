# DABC Euphorbia Apartment Management System - Complete Deployment Playbook

## Executive Summary

This playbook guides you through deploying the Apartment Management System to production for apartment owners to access from anywhere.

**Timeline**: ~30 minutes for deployment, additional time for email/monitoring setup

**End Result**: 
- ✅ Application accessible at public URL
- ✅ Owners can log in from anywhere
- ✅ Email notifications working
- ✅ Monitoring and alerts active
- ✅ Custom domain configured

---

## Phase 1: Render Deployment (CRITICAL)

### Pre-Deployment Checklist

- [ ] GitHub repository pushed with latest code
- [ ] All sensitive data in `.env` (not committed)
- [ ] `render.yaml` and `.env.example` files in repo
- [ ] Two strong JWT secrets generated (32+ random characters)
- [ ] Gmail or SMTP email account ready
- [ ] Render.com account created

### Deployment Steps

#### Step 1: Create PostgreSQL Database

**Time: 5 minutes**

1. Go to https://render.com/dashboard
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `apartment-mgmt-db`
   - **Database**: `apartment_mgmt`
   - **User**: `postgres` (default)
   - **Region**: Oregon (or nearest to users)
   - **Plan**: Free tier
4. Click **Create Database**
5. **Wait 1-2 minutes** for database to initialize
6. Copy connection string from **Connections** section
   - Format: `postgresql://postgres:xxxxx@dpg-xxxxx.oregon-postgres.render.com:5432/apartment_mgmt`
   - **Save this** — you'll need it in next step

#### Step 2: Deploy Backend & Frontend via Blueprint

**Time: 10-15 minutes**

1. Click **New +** → **Blueprint**
2. Paste GitHub repo: `https://github.com/kbsubaash/ApartmentMgmt.git`
3. Click **Connect** and authorize
4. Render auto-detects `render.yaml`
5. Review services:
   - `apartment-mgmt-backend` 
   - `apartment-mgmt-frontend`
6. Click **Apply**

#### Step 3: Configure Backend Environment Variables

**Time: 5 minutes**

In Render dashboard, select `apartment-mgmt-backend` service:

1. Click **Environment** tab
2. Add these variables:

```
NODE_ENV                 = production

# PostgreSQL Connection (from Step 1)
DATABASE_URL             = postgresql://postgres:xxxxx@dpg-xxxxx.region.render.com:5432/apartment_mgmt

# Generate strong random secrets:
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET        = [generate-random-secret-32-chars]
JWT_REFRESH_SECRET       = [generate-random-secret-32-chars]

JWT_ACCESS_EXPIRY        = 15m
JWT_REFRESH_EXPIRY       = 7d

# Email Configuration (Gmail example)
MAIL_HOST                = smtp.gmail.com
MAIL_PORT                = 587
MAIL_USER                = your-email@gmail.com
MAIL_PASS                = your-app-password

MAIL_FROM                = no-reply@dabc-euphorbia.com
CLIENT_ORIGIN            = https://apartment-mgmt-frontend.onrender.com
```

**Gmail Setup Note**: 
- Use App Password (not regular Gmail password)
- Enable 2FA on Gmail: https://support.google.com/accounts/answer/185833
- Generate App Password: https://myaccount.google.com/apppasswords

#### Step 4: Configure Frontend Environment Variables

**Time: 2 minutes**

Select `apartment-mgmt-frontend` service:

1. Click **Environment** tab
2. After backend deploys, copy its URL from the service page (e.g., `https://apartment-mgmt-backend.onrender.com`)
3. Add this variable:

```
VITE_API_URL             = https://apartment-mgmt-backend.onrender.com/api
```

#### Step 5: Monitor Deployment

**Time: 10-15 minutes**

1. Watch **Logs** tab for each service
2. Backend should show:
   ```
   [nodemon] starting `node server.js`
   SQLite database connected via Prisma
   Server running on port 5000
   ```
3. Frontend should show:
   ```
   VITE v5.4.21 ready in XXX ms
   ➜  Local:   http://localhost:3000
   ```
4. Both should show "Live" status (green)

### Deployment Verification

Once both services are "Live":

#### Test Backend Health

```bash
# In any terminal or browser, visit:
https://apartment-mgmt-backend.onrender.com/api/health

# You should see response:
{"status":"ok","timestamp":"2026-04-10T12:34:56.789Z"}
```

#### Test Frontend

1. Open in browser: `https://apartment-mgmt-frontend.onrender.com`
2. You should see login page
3. Log in with:
   - **Email**: `admin@dabc-euphorbia.com`
   - **Password**: `Admin@1234`
4. You should see admin dashboard

#### Test API Integration

In frontend, try:
- [ ] View members list
- [ ] View circulars
- [ ] View complaints
- [ ] Create a test circular (draft)
- [ ] Check audit logs

**If any test fails**:
1. Check **Logs** in Render dashboard
2. Look for error messages
3. Common issues:
   - Missing environment variable
   - Wrong DATABASE_URL format
   - Database not initialized
   - Solution: Fix env var, click **Manual Deploy**

---

## Phase 2: Email Configuration

### Gmail Setup (Recommended)

**Time: 5 minutes**

1. Enable 2-Factor Authentication: https://support.google.com/accounts/answer/185833
2. Generate App Password: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates 16-char password
3. Copy this password
4. Add to Render backend environment:
   - `MAIL_USER`: your-email@gmail.com
   - `MAIL_PASS`: 16-character password from Google

### Email Features Already Implemented

✅ Welcome email on registration
✅ Password reset emails
✅ Maintenance payment reminder emails
✅ Circular notifications
✅ Poll notifications
✅ Complaint status updates

### Test Email

1. Register a new test account
2. Check inbox for welcome email
3. If email not received:
   - Check spam/promotions folder
   - Verify `MAIL_USER` and `MAIL_PASS` in Render
   - Check backend logs for errors

---

## Phase 3: Monitoring Setup

### Option A: Uptime Monitoring (Recommended - Free)

**Time: 5 minutes**

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Click **Add Monitor** → **HTTP(s)**
4. Configure:
   - **Friendly Name**: `Apartment Management Backend`
   - **URL**: `https://apartment-mgmt-backend.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Your email
5. Click **Create Monitor**
6. You'll get email alerts if service goes down

### Option B: Error Tracking with Sentry (Recommended - Free)

**Time: 10 minutes**

1. Go to https://sentry.io and sign up
2. Create new project:
   - Platform: **Node.js**
   - Framework: **Express**
3. Sentry generates a DSN (connection string)
4. Add to Render backend environment:
   - `SENTRY_DSN`: [paste the DSN]
5. Click **Manual Deploy** on backend in Render
6. Wait for redeploy
7. Once live, any errors will appear in Sentry dashboard
8. Optional: Connect Slack for instant notifications

### Option C: Render Native Monitoring

**Already Included**:
- ✅ Real-time logs
- ✅ CPU/Memory metrics
- ✅ Service health status
- ✅ Uptime percentage

Access in Render dashboard:
- Service page → **Logs** (real-time logs)
- Service page → **Metrics** (CPU, memory, requests)

---

## Phase 4: Custom Domain Setup (Optional)

**Time: 15-20 minutes** (if domain already purchased)

### If You Don't Have a Domain

1. Purchase domain at:
   - GoDaddy
   - Namecheap
   - Vercel Domains
   - Etc.
2. **For this example**: `dabc-euphorbia.com`

### Configure Custom Domain on Render

#### For Frontend

1. Go to Render dashboard → `apartment-mgmt-frontend` service
2. Click **Settings** → **Custom Domains**
3. Add domain: `dabc-euphorbia.com`
4. Render generates DNS records
5. Go to your domain registrar (GoDaddy, Namecheap, etc.)
6. Add Render's DNS records to your domain
7. Wait 15-30 minutes for DNS propagation
8. Visit `https://dabc-euphorbia.com` — should work!

#### For Backend (Advanced - Optional)

1. Use subdomain: `api.dabc-euphorbia.com`
2. Add custom domain to backend service in Render
3. Add DNS records to your domain registrar
4. Update frontend `VITE_API_URL`:
   - Change to: `https://api.dabc-euphorbia.com/api`
5. Redeploy frontend

### HTTPS Automatically Enabled

✅ Render auto-provisions free SSL with Let's Encrypt
✅ All traffic forced to HTTPS
✅ No additional configuration needed

---

## Phase 5: User Documentation

### README for End Users

Create a guide for apartment owners:

**Topics to Cover**:
- [ ] How to access the application
- [ ] How to log in
- [ ] Password reset procedure
- [ ] Main dashboard overview
- [ ] How to view circulars
- [ ] How to vote on polls
- [ ] How to sign circulars digitally
- [ ] How to submit complaints
- [ ] How to view member directory
- [ ] How to access community contacts
- [ ] Contact support email

### Quick Start Guide (for Owners)

```
DABC Euphorbia Apartment Management System
─────────────────────────────────────────

WEB: https://apartment-mgmt-frontend.onrender.com
     (or https://dabc-euphorbia.com if custom domain)

LOGIN:
Username: your-email@gmail.com (or registered email)
Password: your-password

FEATURES:
✓ View building circulars and announcements
✓ Vote on building decisions (polls/surveys)
✓ Digitally sign important circulars
✓ Submit and track complaints
✓ View community contacts (electrician, plumber, etc.)
✓ Manage your profile
✓ View fellow members
✓ Stay updated with notifications

SUPPORT:
Email: admin@dabc-euphorbia.com
Phone: [apartment association phone]

FORGOT PASSWORD?
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link
5. Create new password
```

---

## Complete Deployment Checklist

### Before Deployment
- [ ] Code pushed to GitHub
- [ ] `render.yaml` in repo
- [ ] Environment variables documented
- [ ] Database backup strategy planned
- [ ] Email credentials prepared
- [ ] JWT secrets generated

### During Deployment
- [ ] PostgreSQL database created
- [ ] Blueprint connected to GitHub
- [ ] Backend env vars configured
- [ ] Frontend env vars configured
- [ ] Both services deployed successfully

### After Deployment
- [ ] Backend health check passes
- [ ] Frontend loads and displays login
- [ ] Admin login works
- [ ] Member list loads
- [ ] At least one test circular created
- [ ] Email test sent
- [ ] Uptime monitoring configured
- [ ] Error tracking configured
- [ ] Custom domain configured (optional)
- [ ] User documentation created

### Go-Live Steps
- [ ] All checkboxes above completed ✓
- [ ] Share frontend URL with apartment owners
- [ ] Create user accounts for all residents/committee members
- [ ] Send welcome email with login instructions
- [ ] Conduct test with one user to confirm works
- [ ] Full rollout to all owners

---

## Post-Deployment: Maintenance

### Daily
- Monitor email notifications are sending
- Check Render logs daily for errors

### Weekly
- Review uptime monitoring reports
- Check Sentry for new errors
- Monitor database growth

### Monthly
- Backup database (Render does this automatically, but verify)
- Review audit logs for suspicious activity
- Update documentation as needed

### Quarterly
- Security audit
- Performance review
- Plan feature updates

---

## Troubleshooting Guide

### Backend Won't Deploy
```
Error: Cannot find module or Build failed

Solution:
1. Check build logs in Render
2. Verify all env vars set
3. Try Manual Deploy button
4. Check that package.json exists in /backend folder
5. Check for typos in DATABASE_URL
```

### Frontend Blank Screen
```
Solution:
1. Open browser console (F12)
2. Look for errors about API connection
3. Verify VITE_API_URL env var
4. Check that backend is running
5. Verify no CORS errors in backend logs
```

### Login Failed
```
Solution:
1. Check email/password in browser console (don't expose)
2. Verify database initialized with seed data
3. Check backend auth logs
4. Try the default: admin@dabc-euphorbia.com / Admin@1234
```

### Emails Not Sending
```
Solution:
1. Verify MAIL_USER and MAIL_PASS in Render env vars
2. Check that Gmail App Password (not regular password) used
3. Verify Gmail 2FA enabled
4. Check backend logs for SMTP errors
5. Check spam folder for emails
```

### Database Connection Failed
```
Solution:
1. Verify DATABASE_URL matches PostgreSQL connection string exactly
2. Check that PostgreSQL database service created on Render
3. Check database status in Render dashboard
4. Try Manual Deploy on backend
5. Check backend logs for connection errors
```

---

## Support & Next Steps

### Getting Help
- Backend errors: Check Render logs
- Frontend errors: Check browser console (F12)
- Database issues: Check Render PostgreSQL logs
- Email issues: Check backend logs for SMTP errors

### After Going Live
1. Monitor for user feedback
2. Fix any bugs quickly
3. Plan feature enhancements based on user needs
4. Regular security audits
5. Database backups and disaster recovery plan

### Future Enhancements
- [ ] Mobile app (React Native)
- [ ] Advanced reporting dashboards
- [ ] Maintenance billing module
- [ ] Payment gateway integration
- [ ] SMS notifications (optional)
- [ ] Two-factor authentication (2FA)
- [ ] Role-based access refinement

---

## Quick Reference: URLs After Deployment

```
Frontend (Public):    https://apartment-mgmt-frontend.onrender.com
Backend API:          https://apartment-mgmt-backend.onrender.com
Health Check:         https://apartment-mgmt-backend.onrender.com/api/health
Render Dashboard:     https://render.com/dashboard
Uptime Monitor:       https://uptimerobot.com
Sentry Errors:        https://sentry.io/dashboard
Custom Domain:        https://dabc-euphorbia.com (if configured)
```

---

**Deployment Status**: Ready to Deploy ✅

All code is pushed to GitHub and ready for production deployment.

Next action: Follow Phase 1 steps above to deploy to Render.
