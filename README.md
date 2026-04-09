# DABC Euphorbia Phase 3 Apartment Owners Welfare Association
## Apartment Management System

Full-stack web application for managing apartment association administrative activities.

**Tech Stack:** React 18 + Vite (frontend) | Node.js + Express + MongoDB (backend)

---

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10
- MongoDB (local) **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

---

## Project Structure

```
apartment-management-system/
├── backend/     ← Node.js + Express API
└── frontend/    ← React + Vite UI
```

---

## Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT secrets, SMTP config
npm install
npm run seed        # Creates 19 flats (1A-1 to 1A-19) + default admin user
npm run dev         # Starts on http://localhost:5000
```

### Default Admin Credentials (after seed)
| Field    | Value                       |
|----------|-----------------------------|
| Email    | admin@dabc-euphorbia.com    |
| Password | Admin@1234                  |

> Change these in `.env` before running seed in production.

### Backend Environment Variables

| Variable              | Description                              | Required |
|-----------------------|------------------------------------------|----------|
| `MONGODB_URI`         | MongoDB connection string                | ✅       |
| `JWT_ACCESS_SECRET`   | Secret for access tokens (min 32 chars)  | ✅       |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens (min 32 chars) | ✅       |
| `JWT_ACCESS_EXPIRY`   | Access token TTL (default: `15m`)        |          |
| `JWT_REFRESH_EXPIRY`  | Refresh token TTL (default: `7d`)        |          |
| `PORT`                | Server port (default: `5000`)            |          |
| `CLIENT_ORIGIN`       | Frontend URL for CORS                    |          |
| `SMTP_HOST`           | SMTP server hostname                     |          |
| `SMTP_PORT`           | SMTP port (default: `587`)               |          |
| `SMTP_USER`           | SMTP username                            |          |
| `SMTP_PASS`           | SMTP password / app password             |          |
| `SMTP_FROM`           | From address for outgoing emails         |          |
| `UPLOAD_DIR`          | Directory for file uploads (default: `uploads`) |   |

---

## Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL
npm install
npm run dev         # Starts on http://localhost:5173
```

### Frontend Environment Variables

| Variable         | Description                        |
|------------------|------------------------------------|
| `VITE_API_URL`   | Backend API base URL               |

---

## API Endpoints Summary

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /api/auth/register    | Register user            |
| POST   | /api/auth/login       | Login, returns JWT       |
| POST   | /api/auth/refresh     | Refresh access token     |
| POST   | /api/auth/logout      | Logout (invalidate token)|
| GET    | /api/auth/me          | Get own profile          |

### Members
| Method | Endpoint             | Roles               |
|--------|----------------------|---------------------|
| GET    | /api/members         | Admin, Committee    |
| POST   | /api/members         | Admin               |
| GET    | /api/members/:id     | Admin, Committee, self |
| PUT    | /api/members/:id     | Admin               |
| DELETE | /api/members/:id     | Admin (soft delete) |

### Flats
| Method | Endpoint                  | Roles  |
|--------|---------------------------|--------|
| GET    | /api/flats                | All    |
| POST   | /api/flats                | Admin  |
| PUT    | /api/flats/:id            | Admin  |
| POST   | /api/flats/:id/assign     | Admin  |
| POST   | /api/flats/:id/unassign   | Admin  |

### Circulars
| Method | Endpoint                      | Roles              |
|--------|-------------------------------|--------------------|
| GET    | /api/circulars                | All (scoped)       |
| POST   | /api/circulars                | Admin, Committee   |
| PUT    | /api/circulars/:id            | Admin, Committee   |
| POST   | /api/circulars/:id/publish    | Admin, Committee   |
| DELETE | /api/circulars/:id            | Admin              |

### Complaints
| Method | Endpoint                       | Roles             |
|--------|--------------------------------|-------------------|
| GET    | /api/complaints                | All (scoped)      |
| POST   | /api/complaints                | All               |
| PUT    | /api/complaints/:id            | All (scoped)      |
| POST   | /api/complaints/:id/comments   | All               |

### Notifications
| Method | Endpoint                          | Description          |
|--------|-----------------------------------|----------------------|
| GET    | /api/notifications                | Own notifications    |
| PUT    | /api/notifications/:id/read       | Mark one read        |
| PUT    | /api/notifications/read-all       | Mark all read        |

---

## Roles & Permissions

| Feature             | Admin | Committee | Resident    |
|---------------------|-------|-----------|-------------|
| Manage members      | Full  | Read      | Own profile |
| Manage flats        | Full  | Read      | Read        |
| Create circulars    | ✅    | ✅        | ❌          |
| Publish circulars   | ✅    | ✅        | ❌          |
| View circulars      | ✅    | ✅        | Published only |
| Submit complaints   | ✅    | ✅        | ✅          |
| Manage complaints   | ✅    | ✅        | Own only    |
| View audit logs     | ✅    | ❌        | ❌          |

---

## Production Deployment

**Backend → Render / Railway**
1. Set all env vars in the platform dashboard
2. Set `MONGODB_URI` to MongoDB Atlas connection string
3. Build command: `npm install`  Start command: `node server.js`

**Frontend → Vercel**
1. Set `VITE_API_URL` to your backend URL
2. Build command: `npm run build`  Output dir: `dist`
