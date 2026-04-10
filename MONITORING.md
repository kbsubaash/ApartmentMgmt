# Monitoring & Error Tracking Setup Guide

## Overview

Production monitoring helps you:
- Detect issues before users report them
- Debug production problems with logs and error traces
- Monitor performance and uptime
- Track user engagement and errors
- Alert on critical issues

---

## 1. Render Built-In Monitoring

Render provides free monitoring for all deployed applications.

### Access Logs

1. Go to Render Dashboard
2. Select service (`apartment-mgmt-backend` or `apartment-mgmt-frontend`)
3. Click **Logs** tab
4. View real-time logs, search by keyword
5. Set log retention period

### Metrics

1. Select service
2. Click **Metrics** tab
3. View:
   - CPU usage
   - Memory usage
   - Requests per second
   - Response time

### Alerts

1. Click **Alerts** (on service page)
2. Create alert for:
   - Service down
   - High CPU/Memory
   - High error rate

---

## 2. Environment Variables for Error Tracking

### Backend Error Handling

Already implemented in error handler middleware:

```javascript
// backend/src/middleware/errorHandler.middleware.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    stack: err.stack,
  });
  
  res.status(status).json({ message });
};
```

---

## 3. Sentry Error Tracking (Recommended)

Sentry captures and reports errors automatically.

### Setup

1. Go to https://sentry.io and sign up (free tier available)
2. Create project: **Node.js** → **Express**
3. Sentry provides a DSN (connection string)

### Backend Integration

Install Sentry:

```bash
cd backend
npm install @sentry/node @sentry/tracing
```

Add to `backend/server.js`:

```javascript
import * as Sentry from "@sentry/node";

// Initialize early
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.RequestHandler(),
  ],
});

// Use Sentry middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler with Sentry
app.use(Sentry.Handlers.errorHandler());
```

### Frontend Integration (Optional)

Install Sentry for React:

```bash
cd frontend
npm install @sentry/react @sentry/tracing
```

Add to `frontend/src/main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Environment Variables

Add to `.env` (backend):

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Add to `.env.example` (frontend):

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Monitor Errors

Log into Sentry dashboard to see:
- Crash reports
- Error rate graphs
- Affected users
- Stack traces
- Replay sessions

---

## 4. Morgan Request Logging

Already implemented:

```javascript
// backend/src/app.js
import morgan from 'morgan';

app.use(morgan('dev'));
```

### Production Logging

For production, use combined format:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // More detailed
} else {
  app.use(morgan('dev'));
}
```

Log format: `IP - USER - [TIME] METHOD PATH HTTP_STATUS RESPONSE_TIME - CONTENT_LENGTH`

---

## 5. Custom Audit Logging

Already implemented:

Logs all critical operations for compliance and debugging:

```javascript
// backend/src/services/audit.service.js
await AuditLog.create({
  userId,
  action: 'CREATED_CIRCULAR',
  resourceType: 'Circular',
  resourceId: circularId,
  ipAddress: req.ip,
  changes: { before, after },
  timestamp: new Date(),
});
```

### Query Audit Logs

```javascript
// View all admin actions
const logs = await AuditLog.findMany({
  where: { action: 'CREATED_USER' },
  orderBy: { timestamp: 'desc' },
});
```

---

## 6. Uptime Monitoring

### Option A: Render Uptime Monitoring

Render automatically monitors your services:

1. Service page → Health
2. View uptime percentage (99.9%, etc.)
3. View incidents

### Option B: Uptime Robot (Free)

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Add monitor: `https://apartment-mgmt-backend.onrender.com/api/health`
4. Set to check every 5 minutes
5. Get email alerts if service goes down

### Option C: StatusPage

1. Create public status page: https://www.atlassian.com/software/statuspage
2. Share with users
3. Display service health

---

## 7. Performance Monitoring

### Response Time Analysis

Enable performance tracking in Sentry:

```javascript
import Sentry from "@sentry/node";

const transaction = Sentry.startTransaction({
  op: "database.query",
  name: "Fetch members",
});

// ... do work ...

transaction.finish();
```

### Database Query Performance

Monitor slow queries in PostgreSQL:

```sql
-- Find slow queries (queries over 1 second)
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC;
```

---

## 8. Log Aggregation

### Option A: Render Built-In

Already included with Render:

- Access via Render dashboard
- Real-time log streaming
- Search and filter
- Export logs

### Option B: Loggly (Recommended)

1. Sign up: https://www.loggly.com (free tier available)
2. Install Loggly client:
   ```bash
   npm install winston-loggly
   ```
3. Configure in `backend/server.js`:
   ```javascript
   import winston from 'winston';
   import winstonLoggly from 'winston-loggly';
   
   const logger = winston.createLogger({
     transports: [
       new winstonLoggly({
         token: process.env.LOGGLY_TOKEN,
         subdomain: process.env.LOGGLY_SUBDOMAIN,
       }),
     ],
   });
   ```

---

## 9. Health Check Endpoints

Already implemented:

Backend health check:

```javascript
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);
```

Frontend health check:

```javascript
// frontend/server.js
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'frontend' })
);
```

Monitor these:
- Endpoint: `https://apartment-mgmt-backend.onrender.com/api/health`
- Expected response: `{"status":"ok"}`
- Response time: < 200ms

---

## 10. Database Monitoring

### PostgreSQL Monitoring

Check database health:

```bash
# Connect to database and run
SELECT version();  -- Check PostgreSQL version
SELECT pg_database_size('apartment_mgmt');  -- Check database size
SELECT count(*) FROM pg_stat_activity;  -- Check active connections
```

### Render PostgreSQL Monitoring

1. Go to Render dashboard → Database service
2. Click **Metrics**
3. View:
   - Connections
   - Query performance
   - Storage usage
   - Backup status

---

## 11. User Issue Reproduction

### Session Recording (Optional)

Use Sentry Replay to record user sessions:

```javascript
// Auto-enabled in Sentry config
// Captures mouse movements, network activity, logs
// Helpful for reproducing bugs
```

### User Feedback Widget

Collect feedback from users directly:

```javascript
// In React component
import * as Sentry from "@sentry/react";

Sentry.captureUserFeedback({
  email: user.email,
  name: user.name,
  comments: "App crashed when uploading document",
  eventId: lastEventId,
});
```

---

## 12. Alerts & Notifications

### Email Alerts

Set up alerts in Render:

1. Service → Alerts
2. Create alert for:
   - Service down
   - Memory > 90%
   - CPU > 90%
   - Error rate > 5%
3. Get email when triggered

### Slack Alerts (Sentry)

1. In Sentry: Settings → Integrations
2. Connect Slack
3. Set #bugs channel for errors
4. Get instant notifications

### SMS Alerts (PagerDuty)

1. Go to https://www.pagerduty.com
2. Integrate with Sentry/Render
3. Get SMS for critical issues

---

## 13. Monitoring Checklist

Production monitoring setup:

- [ ] Render logs accessible
- [ ] Uptime monitoring configured (Uptime Robot)
- [ ] Error tracking setup (Sentry)
- [ ] Database monitoring enabled
- [ ] Health check endpoints verified
- [ ] Audit logging active
- [ ] Alerts configured (email, Slack, SMS)
- [ ] Performance baselines established
- [ ] Log retention configured
- [ ] Backup strategy verified

---

## 14. Incident Response

When issues detected:

1. **Check Render logs** — Real-time log streaming
2. **Check Sentry** — Error details and stack traces
3. **Check metrics** — CPU/memory/database size
4. **Check audit logs** — User actions
5. **Reproduce** — Use session recording if available
6. **Fix** — Deploy updated code
7. **Post-mortem** — Document incident and prevention

---

## 15. Sample Monitoring Dashboard

Create dashboard in Render showing:

```
┌─────────────────────────────────────────────┐
│ Apartment Management System - Status        │
├────────────────┬────────────────────────────┤
│ Service        │ Status | Uptime | Response │
├────────────────┼────────────────────────────┤
│ Backend        │   ✅   │  99.9% │  145ms  │
│ Frontend       │   ✅   │  99.9% │  256ms  │
│ Database       │   ✅   │ 100%   │  12ms   │
└────────────────┴────────────────────────────┘

Last Hour Errors: 2
Last 24h Errors: 12
Current Users: 23
Avg Response Time: 187ms
DB Size: 245 MB
```

---

## Next Steps

1. ✅ Enable Render monitoring
2. ✅ Set up Uptime Robot
3. ✅ Configure Sentry for error tracking
4. ✅ Set up Slack alerts
5. ✅ Test monitoring with sample error
6. ✅ Document runbook for common issues
7. ✅ Train team on monitoring tools

## See Also

- [Deployment Guide](./DEPLOYMENT_RENDER.md)
- [PostgreSQL Setup](./POSTGRES_SETUP.md)
- [Security Guide](./SECURITY.md)
- [Docker Guide](./DOCKER_GUIDE.md)
