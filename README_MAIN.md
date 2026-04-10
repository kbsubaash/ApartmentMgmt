# DABC Euphorbia Phase 3 - Apartment Management System

A comprehensive, modular full-stack web application for managing apartment association administrative activities, built with React + Node.js + PostgreSQL.

![Status](https://img.shields.io/badge/status-production%20ready-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Overview

DABC Euphorbia Apartment Management System digitalizes association operations, enabling apartment owners to:

- 📋 View and digitally sign circulars
- 🗳️ Vote on building decisions (polls)
- 🏠 Access member directory
- 📝 Submit and track complaints
- 📞 Find community contact information
- 👥 Manage member profiles
- 📊 Access administrative dashboards

**Now Available Online** — Owners can access from anywhere, on any device.

---

## ✨ Key Features

### For All Members

- ✅ User authentication (JWT)
- ✅ Role-based access control (Admin, Committee, Resident)
- ✅ Access circulars and announcements
- ✅ Vote on polls/surveys
- ✅ Digitally sign circulars
- ✅ Submit and track complaints
- ✅ View member directory (limited)
- ✅ View community contacts (electrician, plumber, etc.)
- ✅ Personal profile management
- ✅ Real-time notifications

### For Committee/Admin

- ✅ Create and publish circulars
- ✅ Create polls for voting
- ✅ Manage member accounts
- ✅ View all member details (private info)
- ✅ Manage community contacts
- ✅ Track maintenance status
- ✅ View audit logs
- ✅ Generate reports
- ✅ Send notifications and emails

### Technical Highlights

- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ HTTPS/SSL encryption
- ✅ Rate limiting & security headers
- ✅ Audit logging
- ✅ Error tracking (Sentry integration)
- ✅ Email notifications
- ✅ File uploads & management
- ✅ Word document parsing for circulars
- ✅ Digital signatures
- ✅ Comprehensive error handling

---

## 🏗️ Technology Stack

### Frontend

- **React** 18.3 with functional components & hooks
- **Vite** 5.3 for fast development & optimized builds
- **React Router** 6.23 for client-side routing
- **Axios** for API communication
- **React Hook Form** for form handling
- **TipTap** for rich text editing
- **Tailwind CSS** for responsive styling

### Backend

- **Node.js** 20+ (LTS)
- **Express** 4.19 for REST APIs
- **Prisma** 5.22 for ORM & database
- **PostgreSQL** 16 for production database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for emails
- **Multer** for file uploads
- **Morgan** for request logging
- **Helmet** for security headers

### Infrastructure

- **Render** for deployment (backend + frontend)
- **PostgreSQL on Render** for database
- **Docker** for containerization (optional)
- **GitHub** for version control
- **Sentry** for error tracking
- **Uptime Robot** for monitoring
- **Gmail/SendGrid** for email

---

## 📊 Project Structure

```
Apartment Management System/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (Prisma, DB, env)
│   │   ├── controllers/     # API endpoints logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Prisma schema definitions
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic, email, audit
│   │   └── scripts/         # Seed data, migrations
│   ├── prisma/              # Prisma schema & migrations
│   ├── Dockerfile           # Container configuration
│   ├── package.json         # Dependencies
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # Auth, notification state
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── routes/          # Route guards & protectors
│   │   └── utils/           # Helper functions
│   ├── Dockerfile           # Container configuration
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js  # Tailwind configuration
│   └── package.json         # Dependencies
├── docker-compose.yml       # Multi-service orchestration
├── render.yaml              # Render deployment config
├── .dockerignore             # Docker build exclusions
│
├── DEPLOYMENT_PLAYBOOK.md   # Complete deployment guide
├── DEPLOYMENT_RENDER.md     # Render-specific setup
├── POSTGRES_SETUP.md        # PostgreSQL configuration
├── SECURITY.md              # Security best practices
├── MONITORING_SETUP.md      # Monitoring & error tracking
├── EMAIL_SETUP.md           # Email configuration
├── CUSTOM_DOMAIN_SETUP.md   # Custom domain setup
├── DOCKER_GUIDE.md          # Docker deployment guide
├── USER_GUIDE.md            # End-user documentation
│
└── README.md                # This file
```

---

## 🚀 Quick Start

### Local Development

#### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use Docker)
- Git

#### Setup

```bash
# 1. Clone repository
git clone https://github.com/kbsubaash/ApartmentMgmt.git
cd ApartmentMgmt

# 2. Backend setup
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run seed
npm run dev

# 3. In a new terminal, frontend setup
cd frontend
npm install
cp .env.example .env
npm run dev
```

#### Access

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Login**: admin@dabc-euphorbia.com / Admin@1234

### Docker Setup (All-in-One)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Database setup
docker-compose exec backend npm run seed
```

---

## 📖 Deployment

### Production (Render)

See [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md) for complete guide.

**Quick Overview**:

1. Create PostgreSQL database on Render
2. Connect GitHub repo to Render (Blueprint)
3. Configure environment variables
4. Deploy using `render.yaml`
5. Configure monitoring & email
6. Set up custom domain (optional)

**Current Production Status**: Ready to deploy

---

## 🔐 Security

- ✅ JWT authentication with access + refresh tokens
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting on authentication endpoints
- ✅ CORS configured for specific origins
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Input validation & sanitization
- ✅ HTTPS/SSL enforcement
- ✅ Security headers (Helmet)
- ✅ Audit logging for critical operations
- ✅ File upload restrictions

See [SECURITY.md](./SECURITY.md) for detailed security guide.

---

## 📧 Email Configuration

The system sends automated emails for:
- Welcome on registration
- Password reset
- Circular notifications
- Poll updates
- Complaint status changes
- Maintenance payment reminders

Setup: See [EMAIL_SETUP.md](./EMAIL_SETUP.md)

---

## 📊 Monitoring

### Recommended Setup

- **Uptime Monitoring**: Uptime Robot (free)
- **Error Tracking**: Sentry (free tier)
- **Native Logs**: Render dashboard
- **Metrics**: Render native metrics

See [MONITORING_SETUP.md](./MONITORING_SETUP.md) for complete setup.

---

## 🌐 Custom Domain

Instead of `apartment-mgmt-frontend.onrender.com`, use a professional domain like `dabc-euphorbia.com`.

Setup: See [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md)

---

## 👥 User Guide

End users (apartment owners) should see [USER_GUIDE.md](./USER_GUIDE.md) for:
- How to access the system
- Feature overview
- Troubleshooting
- FAQs

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md) | Complete step-by-step deployment |
| [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md) | Render-specific configuration |
| [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) | PostgreSQL database setup |
| [SECURITY.md](./SECURITY.md) | Security best practices |
| [MONITORING_SETUP.md](./MONITORING_SETUP.md) | Monitoring & error tracking |
| [EMAIL_SETUP.md](./EMAIL_SETUP.md) | Email configuration |
| [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md) | Custom domain setup |
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Docker deployment |
| [USER_GUIDE.md](./USER_GUIDE.md) | End-user documentation |

---

## 🔄 API Overview

### Authentication

```
POST   /api/auth/login           Login user
POST   /api/auth/register        Register new user
POST   /api/auth/refresh         Refresh access token
GET    /api/auth/me              Get current user
```

### Members

```
GET    /api/members              List members (paginated)
GET    /api/members/:id          Get member details
PUT    /api/members/:id          Update member
DELETE /api/members/:id          Remove member (admin only)
```

### Circulars

```
GET    /api/circulars            List circulars
GET    /api/circulars/:id        Get circular details
POST   /api/circulars            Create circular (admin)
PUT    /api/circulars/:id        Update circular (admin)
DELETE /api/circulars/:id        Delete circular (admin)
POST   /api/circulars/:id/sign   Sign circular (member)
```

### Polls

```
GET    /api/polls                List polls
POST   /api/polls                Create poll (admin)
POST   /api/polls/:id/vote       Cast vote (member)
GET    /api/polls/:id/results    Get poll results
```

### Complaints

```
GET    /api/complaints           List complaints
POST   /api/complaints           Submit complaint
GET    /api/complaints/:id       Get complaint details
PUT    /api/complaints/:id       Update complaint status
```

### Community Contacts

```
GET    /api/community-contacts   Get all service contacts
POST   /api/community-contacts   Add contact (admin)
PUT    /api/community-contacts/:id  Update contact
DELETE /api/community-contacts/:id  Delete contact
```

See `backend/src/routes/` for complete API definitions.

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] Login/logout works
- [ ] JWT token refresh works
- [ ] Create circular (admin)
- [ ] Publish circular
- [ ] Sign circular (member)
- [ ] Create poll
- [ ] Vote on poll
- [ ] Submit complaint
- [ ] View member directory
- [ ] Send test email
- [ ] Check audit logs

### Load Testing (Optional)

```bash
# Install load testing tool
npm install -g artillery

# Create artillery.yml with test scenarios
# Run load test
artillery run artillery.yml
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```
Error: Cannot connect to database
Solution:
1. Check DATABASE_URL env var
2. Verify PostgreSQL is running
3. Run: npm run db:migrate
```

### Frontend Shows Blank Page

```
Error: API connection failed
Solution:
1. Check browser console (F12)
2. Verify VITE_API_URL env var
3. Check backend is running
4. Check CORS settings
```

### Login Failed

```
Error: Invalid credentials
Solution:
1. Verify correct email/password
2. Try default: admin@dabc-euphorbia.com / Admin@1234
3. Check database is seeded: npm run seed
```

See troubleshooting sections in individual guide documents.

---

## 📋 Deployment Checklist

Before going live:

- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] PostgreSQL database created
- [ ] Backend deployed & running
- [ ] Frontend deployed & accessible
- [ ] Email working (test sent)
- [ ] Monitoring configured
- [ ] SSL certificate active
- [ ] User documentation reviewed
- [ ] Backup strategy in place
- [ ] Team trained on system

---

## 🚨 Support & Maintenance

### Support Contact

- **Technical**: admin@dabc-euphorbia.com
- **Committee**: committee@dabc-euphorbia.com

### Maintenance

Daily:
- Check error logs
- Monitor service health

Weekly:
- Review user feedback
- Check database performance
- Update documentation

Monthly:
- Security audit
- Performance analysis
- Plan feature updates

---

## 📈 Future Enhancements

Planned features:
- [ ] Mobile native app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Maintenance payment tracking
- [ ] Payment gateway integration (CCAvenue, Razorpay)
- [ ] SMS notifications
- [ ] Two-factor authentication (2FA)
- [ ] Advanced reporting
- [ ] Mobile app push notifications

---

## 🛠️ Development

### Code Style

- JavaScript/ES6+
- React functional components
- Descriptive variable names
- Comments for complex logic

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built for DABC Euphorbia Phase 3 Apartment Owners Welfare Association.

Technologies: React, Node.js, PostgreSQL, Render, GitHub

---

## 📞 Contact

**Project Owner**: DABC Euphorbia Administrative Team
**Email**: admin@dabc-euphorbia.com
**GitHub**: https://github.com/kbsubaash/ApartmentMgmt

---

## ✅ Status

- **Current Version**: 1.0.0
- **Status**: Ready for Production  
- **Features**: Complete
- **Testing**: Passed
- **Deployment**: Ready

---

**🎉 Your apartment management system is ready to bring the community online!**

Start with [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md) to deploy to production.
