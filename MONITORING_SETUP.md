# Monitoring & Observability Setup Guide

## Why Monitoring Matters

Production monitoring helps you:
- 🔴 Detect service outages immediately
- 🐛 Catch errors before users complain
- 📊 Track performance and usage
- 📈 Plan capacity upgrades
- ⚠️ Receive alerts for critical issues

---

## Option 1: Uptime Robot (RECOMMENDED - Free)

### What It Does

Monitors your backend API health every 5 minutes. Sends email alert if service goes down.

### Setup (5 minutes)

1. Go to https://uptimerobot.com
2. Click **Sign Up** 
3. Create account with:
   - Email: admin@dabc-euphorbia.com
   - Password: Strong password
4. Verify email
5. Click **Add Monitor** → **HTTP(s)**

### Configure Monitor

1. **Friendly Name**: `Apartment Management Backend`
2. **URL**: `https://apartment-mgmt-backend.onrender.com/api/health`
3. **Monitoring Interval**: `5 minutes`
4. **Alert Contacts**: Add your email
5. **Notifications**: Email when down/up
6. Click **Create Monitor**

### Dashboard

After creation, you'll see:
- ✅ Current status (UP/DOWN)
- 📊 99.9% uptime percentage
- 📈 Uptime graph (last 24h, week, month)
- 🔔 Alert logs

---

## Option 2: Sentry Error Tracking (RECOMMENDED - Free)

### What It Does

Automatically captures all backend errors with stack traces, context, and frequency.

### Setup (10 minutes)

1. Go to https://sentry.io
2. Click **Sign Up**
3. Create account
4. Select **Node.js** → **Express**
5. Sentry creates DSN (connection string)
6. Copy your DSN

### Add to Render

1. Render dashboard → `apartment-mgmt-backend` service
2. **Environment** tab
3. Add variable:

```
SENTRY_DSN = https://your-sentry-dsn@sentry.io/project-id
```

4. Click Save → Service redeploys

### Backend Already Configured

The code already integrates Sentry. Installation optional:

```bash
npm install @sentry/node --save
```

It's already in dependencies.

### Monitor Errors

1. Go to Sentry dashboard
2. See list of errors happening in production
3. Click each error to see:
   - Stack trace
   - User affected
   - Browser/OS used
   - Frequency
   - Context

### Set Up Slack Alerts

1. Sentry Dashboard → **Integrations**
2. Find **Slack**
3. Click **Connect Slack**
4. Choose channel: `#apartment-bugs`
5. Get instant alerts in Slack

---

## Option 3: Render Native Monitoring

### Already Included (Free)

Access in Render dashboard:

#### Logs
- Click service → **Logs** tab
- Real-time streaming
- Full request/error logs
- Search and filter

#### Metrics
- Click service → **Metrics** tab
- CPU usage graph
- Memory usage graph
- Request count
- Response time

#### Uptime
- Service page shows uptime %
- Click on graph to see incidents

---

## Option 4: Advanced Monitoring with New Relic (Optional)

### For Detailed Performance Analysis

1. Go to https://newrelic.com
2. Sign up (has free tier)
3. Create Node.js application
4. Get license key

### Install APM Agent

```bash
npm install newrelic
```

### Configure in Backend

Update `backend/server.js` first line:
```javascript
require('newrelic');
```

Add to environment:
```
NEW_RELIC_LICENSE_KEY = [your key]
NEW_RELIC_APP_NAME = apartment-mgmt-backend
```

### Dashboard Features

- Apdex score (user satisfaction)
- Response time breakdown
- Database query analysis
- Error analysis
- Deployment tracking

---

## Complete Monitoring Setup Checklist

### Phase 1: Basic Monitoring (Required)

- [ ] Uptime Robot monitoring configured
- [ ] Backend health check passing
- [ ] At least one test run completed
- [ ] Received test alert email

### Phase 2: Error Tracking (Recommended)

- [ ] Sentry account created
- [ ] DSN added to Render backend
- [ ] Backend redeployed with Sentry
- [ ] Test error captured
- [ ] Received Sentry alert

### Phase 3: Advanced (Optional)

- [ ] New Relic setup (if needed)
- [ ] Slack integration configured
- [ ] Custom dashboards created
- [ ] Team alerts configured

### Phase 4: Ongoing

- [ ] Check Uptime Robot daily
- [ ] Review Sentry errors weekly
- [ ] Archive resolved errors
- [ ] Plan fixes for frequent errors
- [ ] Monitor trends monthly

---

## Alert Configuration

### Email Alerts

**Uptime Robot Email**:
- Service down
- Service back up
- Monthly report

**Sentry Email**:
- New error
- Error frequency spike
- Daily digest (optional)

### Slack Alerts (Optional)

1. Connect Uptime Robot + Slack
   - Get Slack webhook URL
   - Add to Uptime Robot settings
   - Receive down/up alerts in Slack

2. Connect Sentry + Slack (see Sentry section above)
   - New errors to #apartment-bugs
   - Frequency spikes to #alerts

### Custom Alert Rules

**Create alert for**:
- Error rate > 5%
- Response time > 2 seconds
- 404 errors spike
- Database errors

---

## Dashboard Views

### Operations Team View

What to monitor in production:

```
┌──────────────────────────────────────────┐
│ APARTMENT MANAGEMENT - PRODUCTION STATUS │
├────────────────────────────────────────┬─┤
│ Backend Service                        │✅│ UP
│ Frontend Service                       │✅│ UP
│ PostgreSQL Database                    │✅│ UP
├────────────────────────────────────────┤
│ Backend Response Time:     145ms       │
│ Backend Error Rate:        0%          │
│ Database Connections:      8 of 100    │
│ Disk Used:                 2.3GB       │
│ Last Deployment:           2h ago      │
│ Active Users:              23          │
├────────────────────────────────────────┤
│ Recent Errors:             0           │
│ Pending Alerts:            0           │
│ Last Backup:               1h ago      │
└────────────────────────────────────────┘
```

---

## Troubleshooting Monitoring

### Uptime Robot Shows "DOWN"

**Check**:
1. Backend logs in Render
2. If server crashed, check error logs
3. Click "Alert contacts" to verify email
4. Save monitor, try again

### Sentry Not Capturing Errors

**Check**:
1. SENTRY_DSN set correctly
2. Backend redeployed after adding DSN
3. Backend logs show Sentry initialization
4. Cause intentional error for test

### Metrics Not Showing

**Check**:
1. Render service running (green status)
2. Wait 10 minutes for metrics to populate
3. Try refreshing page
4. Check different time range

---

## Performance Baselines

### Expected Performance

After setup, baseline should be:

```
Backend Health Check:     < 100ms
API Response Time:        < 300ms
Frontend Load Time:       < 3 seconds
Database Queries:         < 50ms average
Error Rate:               < 0.1%
Uptime:                   > 99%
```

### Monitor for Degradation

If metrics degrade:
1. Check recent code changes
2. Review database size
3. Check for new high-traffic features
4. Optimize slow queries
5. Contact hosting provider if infrastructure issue

---

## Log Management

### Accessing Logs

**Render Logs**:
- Service → **Logs** tab
- Real-time view
- 1 week retention free tier

**Search Examples**:
```
error          → Find all errors
GET /api       → Find API calls
500            → Find server errors
userId:123     → Find user-specific logs
```

### Log Retention

- Free tier: Keep 1 week
- Paid tier: Keep 30+ days
- Archive: Export to S3 or similar

### Structured Logging

Backend logs include:
- Timestamp
- Log level (error, warn, info)
- Request ID
- User ID
- Path and method
- Response time
- Status code

---

## Incident Response

### When Service Goes Down

**Immediate**:
1. Get alert notification
2. Log into Render
3. Check backend logs for errors
4. Restart service if needed (click **Deploy**)
5. Notify users if outage > 15 minutes

**Investigation**:
1. Check Sentry for error details
2. Review database status
3. Check API metrics
4. Review recent deployments

**Recovery**:
1. Fix identified issue
2. Deploy hotfix
3. Monitor closely for 1 hour
4. Document incident
5. Post-mortem: Plan prevention

### When Error Rate Spikes

1. Check Sentry dashboard
2. Group similar errors
3. Identify if user-facing or backend
4. Plan fix
5. Deploy update
6. Monitor for recurrence

---

## Best Practices

✅ **Do**:
- Check monitoring dashboard daily
- Set appropriate alert thresholds
- Archive resolved errors
- Review trends monthly
- Plan infrastructure based on growth

❌ **Don't**:
- Ignore alerts
- Leave errors unresolved
- Alert on every issue (causes fatigue)
- Log sensitive data
- Store logs forever (cost)

---

## Scaling Alerts

As system grows, prioritize:

| Priority | Alert Type | Action |
|----------|-----------|--------|
| 🔴 Critical | Service down | Immediate page |
| 🟠 High | Error rate spike | Email + Slack |
| 🟡 Medium | Performance degrade | Daily digest |
| 🟢 Low | Informational | Weekly report |

---

## Next Steps

### Minimal Setup (This Week)

1. [ ] Set up Uptime Robot
2. [ ] Set up Sentry
3. [ ] Receive first alert
4. [ ] Test downtime scenario

### Enhanced Setup (Next Week)

1. [ ] Add Slack integration
2. [ ] Create custom dashboards
3. [ ] Configure alert thresholds
4. [ ] Train team on response

### Advanced Setup (Following Week)

1. [ ] Add New Relic or Similar
2. [ ] Set up log archival
3. [ ] Create monitoring runbook
4. [ ] Plan incident response

---

## Useful Links

- Render Logs: https://render.com/docs/deploy-logs
- Sentry Docs: https://docs.sentry.io/
- Uptime Robot: https://uptimerobot.com/
- New Relic: https://newrelic.com/
- Health Check Pattern: https://staltz.com/healthchecks-microservices.html

---

## Support

Monitoring not working?
1. Check provider connections
2. Verify credentials
3. Review documentation links above
4. Contact provider support
5. Email admin@dabc-euphorbia.com

---

**Monitoring is essential for production reliability. Set it up before going live!**
