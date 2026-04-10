# Security Enhancements Guide

## Overview

This document outlines security best practices for the Apartment Management System, covering authentication, authorization, rate limiting, data protection, and deployment security.

---

## 1. Rate Limiting

Rate limiting protects your API from abuse, brute force attacks, and DDoS.

### Implementation

A rate limit middleware has been added to `backend/src/middleware/rateLimit.middleware.js`:

- **General API**: 100 requests/15 minutes per IP
- **Authentication**: 5 attempts/15 minutes per IP (strict)
- **File uploads**: 10 uploads/hour per IP
- **Public APIs**: 200 requests/hour per IP

### Usage in Routes

```javascript
import { authLimiter, uploadLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

// Apply rate limiter to auth routes
router.post('/login', authLimiter, validate([...]), loginHandler);
router.post('/register', authLimiter, validate([...]), registerHandler);

// Apply rate limiter to upload routes
router.post('/upload', uploadLimiter, uploadHandler);
```

### Integration in app.js

Add global rate limiting:

```javascript
import { generalLimiter } from './middleware/rateLimit.middleware.js';

// Apply to all API routes
app.use('/api', generalLimiter);
```

---

## 2. Input Validation & Sanitization

Already implemented with `express-validator`:

- Validates email format
- Validates password strength
- Sanitizes input to prevent injection attacks
- Type checking on routes

### Example Validation

```javascript
const { body, validationResult } = require('express-validator');

const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim().escape(),
  body('name').trim().escape().notEmpty(),
];

router.post('/register', validateUser, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

---

## 3. JWT (JSON Web Tokens) Security

### Current Implementation

- ✅ Access Token: 15 minutes expiry (short-lived)
- ✅ Refresh Token: 7 days expiry (long-lived)
- ✅ Secure secrets stored in environment variables
- ✅ Token refresh mechanism prevents stale tokens

### Best Practices

1. **Change JWT Secrets in Production**:
   ```env
   JWT_ACCESS_SECRET=generate-strong-random-string-32-chars-min
   JWT_REFRESH_SECRET=generate-another-strong-random-string
   ```

   Generate secure secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Never Expose Tokens**:
   - Store in memory or secure storage
   - Don't log tokens
   - Don't expose in URLs

3. **Use HTTPS in Production**:
   - Automatic with Vercel, Netlify, Render, etc.
   - Prevents token interception

---

## 4. CORS (Cross-Origin Resource Sharing)

Already configured in backend:

```javascript
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
```

### Production Configuration

In `.env` (production):
```env
CLIENT_ORIGIN=https://apartment-mgmt-frontend.onrender.com
```

**Never use `origin: '*'` in production** — it allows any domain to access your API.

---

## 5. Password Hashing

Already implemented with `bcryptjs`:

```javascript
import bcrypt from 'bcryptjs';

// Hash password on account creation
const passwordHash = await bcrypt.hash(password, 10);

// Verify password on login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### Password Requirements (Suggested)

Add to registration validation:

```javascript
body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain uppercase, lowercase, number, and special character')
```

---

## 6. Helmet Security Headers

Already implemented:

```javascript
import helmet from 'helmet';

app.use(helmet());
```

This adds HTTP security headers:
- `Strict-Transport-Security` — Force HTTPS
- `X-Content-Type-Options` — Prevent MIME sniffing
- `X-Frame-Options` — Prevent clickjacking
- `Content-Security-Policy` — Prevent XSS

### Custom Configuration (Optional)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 7. Environment Variables Security

### Development (.env)

```env
NODE_ENV=development
DATABASE_URL=file:./prisma/dev.db
JWT_ACCESS_SECRET=dev-secret-not-used-in-prod
JWT_REFRESH_SECRET=dev-secret-not-used-in-prod
```

### Production (Never commit secrets)

Set directly in Render/deployment platform dashboard:

```
JWT_ACCESS_SECRET: (generate random string)
JWT_REFRESH_SECRET: (generate random string)
DATABASE_URL: postgresql://user:pass@host/db
MAIL_USER: (gmail or SMTP user)
MAIL_PASS: (app password)
```

### .gitignore

Ensure these are in `.gitignore`:

```
.env
.env.local
.env.*.local
*.pem
```

---

## 8. Database Security

### SQL Injection Prevention

**Don't concatenate strings in queries:**
```javascript
// ❌ BAD
const user = await prisma.$queryRaw(`SELECT * FROM User WHERE email = '${email}'`);

// ✅ GOOD
const user = await prisma.user.findUnique({ where: { email } });
```

Prisma parameterizes queries automatically.

### Row-Level Security (Optional for PostgreSQL)

Implement per-user data filtering:

```javascript
// Only return data user has access to
const memberDetails = await prisma.user.findMany({
  where: {
    role: 'Committee', // Only committee can see details
  },
});
```

---

## 9. File Upload Security

Already implemented in `backend/src/middleware/upload.middleware.js`:

- ✅ File type whitelist restrictions
- ✅ File size limits (2MB)
- ✅ Filename sanitization

### Additional Security (Optional)

```javascript
import path from 'path';

// Prevent path traversal attacks
const filename = path.basename(req.file.originalname);

// Validate file extension whitelist
const allowedExtensions = ['.pdf', '.docx', '.jpg', '.png'];
const ext = path.extname(filename).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  return res.status(400).json({ message: 'File type not allowed' });
}
```

---

## 10. HTTPS & TLS

### Production Requirement

✅ Automatically provided by:
- Render — Auto HTTPS
- Vercel — Auto HTTPS
- Netlify — Auto HTTPS
- Let's Encrypt (free certificates)

### Force HTTPS Redirect (Optional)

```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## 11. Sensitive Data Logging

### Don't Log Passwords or Tokens

```javascript
// ❌ BAD
console.log('User login:', { email, password, token });

// ✅ GOOD
console.log('User login:', { email, userId }); // Redact sensitive fields
```

### Audit Logging

Already implemented in `src/services/audit.service.js`:

Logs user actions for compliance:

```javascript
await auditLog.create({
  userId,
  action: 'UPDATED_PROFILE',
  resourceType: 'User',
  resourceId: userId,
  ipAddress: req.ip,
  timestamp: new Date(),
});
```

---

## 12. API Endpoint Security

### Authentication Required on Protected Routes

```javascript
import { authenticate } from '../middleware/auth.middleware.js';

// Protected endpoint
router.get('/api/members/:id', authenticate, getMemberHandler);
```

### Authorization (Role-Based)

```javascript
import { rbac } from '../middleware/rbac.middleware.js';

// Only admins can delete
router.delete('/api/members/:id', 
  authenticate, 
  rbac('Admin'),
  deleteMemberHandler
);
```

---

## 13. Deployment Security Checklist

Before deploying to production:

- [ ] JWT secrets changed (not dev values)
- [ ] DATABASE_URL uses PostgreSQL with strong password
- [ ] MAIL credentials never committed to git
- [ ] NODE_ENV=production
- [ ] HTTPS enabled and enforced
- [ ] CORS origin set to correct frontend domain
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Input validation on all routes
- [ ] Error messages don't expose system details
- [ ] Audit logging enabled
- [ ] Database backups configured
- [ ] Monitoring and alerts set up

---

## 14. Incident Response

If security breach suspected:

1. **Rotate all tokens**: Users must re-login
2. **Review audit logs**: Check suspicious activity
3. **Rotate secrets**: Change JWT_SECRET, database password
4. **Investigate database**: Check for unauthorized access
5. **Monitor logs**: Watch for further attacks
6. **Update users**: Notify of security incident if needed

---

## 15. Further Security Reading

- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Next Steps

1. ✅ Review rate limiting middleware
2. ✅ Update production JWT secrets
3. ✅ Configure PostgreSQL with strong password
4. ✅ Set frontend CLIENT_ORIGIN correctly
5. ✅ Enable audit logging
6. ✅ Test security headers with https://securityheaders.com
7. ✅ Deploy with confidence

See also:
- [Deployment Guide](./DEPLOYMENT_RENDER.md)
- [PostgreSQL Setup](./POSTGRES_SETUP.md)
- [Monitoring Guide](./MONITORING.md)
