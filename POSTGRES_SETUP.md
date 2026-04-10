# PostgreSQL Database Migration Guide

## Why PostgreSQL?

SQLite is suitable for single-user/local development but has limitations in production:
- **Not concurrent-user friendly** — multiple simultaneous connections can lock the database
- **No scaling** — single file-based storage
- **Data loss risk** — on Render free tier, file-based databases don't persist between deployments
- **Limited features** — no advanced indexing, replication, or backup strategies

PostgreSQL solves these issues and is ideal for production.

---

## Step 1: Update Prisma Schema to Support PostgreSQL

Replace the datasource in `backend/prisma/schema.prisma`:

### Current (SQLite):
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### New (PostgreSQL):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 2: Create PostgreSQL Database

### Option A: Render PostgreSQL Service (Recommended for beginners)

1. Go to https://render.com/dashboard
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `apartment-mgmt-db`
   - **Database**: `apartment_mgmt`
   - **User**: `postgres` (default)
   - **Region**: `oregon` (same as backend for performance)
   - **Plan**: Free
4. Click **Create Database**
5. Render generates a connection string like:
   ```
   postgresql://user:password@host:5432/apartment_mgmt
   ```
6. Copy this connection string

### Option B: Local PostgreSQL for Testing

1. Install PostgreSQL: https://www.postgresql.org/download/
2. Create a database:
   ```sql
   CREATE DATABASE apartment_mgmt;
   ```
3. Connection string:
   ```
   postgresql://postgres:password@localhost:5432/apartment_mgmt
   ```

### Option C: PostgreSQL Atlas (Cloud-hosted)

1. Sign up at https://pgadmin.io/ or similar
2. Create a database instance
3. Get the connection string

---

## Step 3: Update Backend Environment Variables

### Development (.env file)

```env
# Database Configuration - PostgreSQL
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/apartment_mgmt"

# JWT Configuration
JWT_ACCESS_SECRET=dabc_euphorbia_access_secret_key_2026_secure_change_this
JWT_REFRESH_SECRET=dabc_euphorbia_refresh_secret_key_2026_secure_change_this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application Configuration
NODE_ENV=development
PORT=5000

# Email Configuration (Optional for local development)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=no-reply@dabc-euphorbia.com

# Client Origin
CLIENT_ORIGIN=http://localhost:5173
```

### Production (On Render Dashboard)

Set these as environment variables in Render:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/database` (from Render PostgreSQL) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_ACCESS_SECRET` | (generate strong random string) |
| `JWT_REFRESH_SECRET` | (generate strong random string) |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USER` | (your email) |
| `MAIL_PASS` | (app password) |
| `MAIL_FROM` | `no-reply@dabc-euphorbia.com` |
| `CLIENT_ORIGIN` | `https://apartment-mgmt-frontend.onrender.com` |

---

## Step 4: Run Database Migrations

After updating `schema.prisma` to PostgreSQL:

### Locally (using local PostgreSQL):

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Or generate new migration
npx prisma migrate dev --name init

# Seed the database with initial data
npm run seed
```

### On Render (Automatic):

Render automatically runs your migration command if specified in `render.yaml`.

Update `render.yaml` to include migration step for backend:

```yaml
services:
  - type: web
    name: apartment-mgmt-backend
    runtime: node
    plan: free
    region: oregon
    rootDir: backend
    buildCommand: npm install && npx prisma migrate deploy
    startCommand: npm run start
    # ... rest of config
```

---

## Step 5: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This updates the Prisma client to work with PostgreSQL.

---

## Step 6: Verify Connection

### Test the connection locally:

```bash
# In backend directory
npx prisma db push

# Or run a test query
npx prisma studio
```

This opens a visual database editor at `http://localhost:5555`

---

## Step 7: Verify in Production

After deploying to Render:

1. Check backend logs in Render dashboard
2. Should see: "Database connected successfully" or similar
3. Test API health endpoint: `https://apartment-mgmt-backend.onrender.com/api/health`
4. Test login with admin credentials

---

## Step 8: Database Backups

### Render Automatic Backups

- Render automatically backs up PostgreSQL daily
- Backups retained for 14 days
- Restore from Render dashboard if needed

### Manual Backup (Optional):

```bash
# Export database to file
pg_dump postgresql://user:pass@host:5432/database > backup.sql

# Restore from backup
psql postgresql://user:pass@host:5432/database < backup.sql
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED"
- Database service not running
- Check DATABASE_URL is correct
- Verify database host and port are accessible

### Error: "relation does not exist"
- Migrations not run
- Run: `npx prisma migrate deploy`

### Error: "authentication failed"
- Check username/password in DATABASE_URL
- Verify database user has correct permissions

### Data Lost After Redeploy
- Free tier databases may not persist
- Use Render's paid PostgreSQL plan for production
- Consider backup strategies

---

## Migration Path: SQLite → PostgreSQL

If you have existing SQLite data to preserve:

1. **Export SQLite data**:
   ```bash
   npx prisma db pull  # Creates schema from current SQLite DB
   ```

2. **Set PostgreSQL as datasource** in `schema.prisma`

3. **Create migration**:
   ```bash
   npx prisma migrate dev --name switch_to_postgres
   ```

4. **Seed with old data** (if needed):
   - Export SQLite to JSON: `npx prisma db export`
   - Import into PostgreSQL via custom script

---

## Performance Optimization for PostgreSQL

Once deployed, optimize your database:

### Indexes (already in schema):
- Email, flat number are unique (automatically indexed)
- Add custom indexes for frequently queried fields:

```sql
CREATE INDEX idx_circular_status ON "Circular"(status);
CREATE INDEX idx_complaint_status ON "Complaint"(status);
CREATE INDEX idx_user_role ON "User"(role);
```

### Query Optimization:
- Use `.select()` in Prisma to fetch only needed fields
- Use pagination (already implemented)
- Use `.include()` carefully (can cause N+1 queries)

---

## Next Steps

1. ✅ Update `schema.prisma` to PostgreSQL
2. ✅ Create PostgreSQL database on Render
3. ✅ Update `.env` with PostgreSQL connection string
4. ✅ Run migrations: `npx prisma migrate deploy`
5. ✅ Test locally
6. ✅ Update Render backend config
7. ✅ Deploy to Render
8. ✅ Monitor logs for connection issues

Once complete, test the application end-to-end with multiple users for concurrency testing.
