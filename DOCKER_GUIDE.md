# Docker Deployment Guide

## What is Docker?

Docker containerizes your application into isolated, reproducible environments. This ensures the app runs the same way on your laptop, on a server, or in production.

## Prerequisites

- Docker installed: https://docs.docker.com/get-docker/
- Docker Compose installed: https://docs.docker.com/compose/install/

## Running Locally with Docker

### 1. Create Environment File

Create a `.env.docker` file in the project root:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=apartment_mgmt

# Node Environment
NODE_ENV=development

# JWT Secrets (generate these)
JWT_ACCESS_SECRET=your-secure-access-secret-here
JWT_REFRESH_SECRET=your-secure-refresh-secret-here

# Email Configuration (optional for development)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=no-reply@dabc-euphorbia.com
```

### 2. Build and Start Services

```bash
# Build all images and start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **PgAdmin**: http://localhost:5050
  - Email: `admin@dabc-euphorbia.com`
  - Password: `admin`
  - Connect to PostgreSQL: Host=`postgres`, User=`postgres`, Password=`yourpassword`

### 4. Run Database Migrations

```bash
# Execute migration inside backend container
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### 5. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## Docker Commands Reference

```bash
# View running containers
docker-compose ps

# Execute command in container
docker-compose exec backend npm run seed

# View container logs
docker-compose logs build-service-name

# Rebuild images after code changes
docker-compose build

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v
```

---

## Dockerfile Explanation

### Backend Dockerfile
- Uses `node:20-alpine` — lightweight Node.js image
- Installs dependencies without dev packages
- Exposes port 5000
- Runs `npm run start`

### Frontend Dockerfile
- **Build stage**: Builds React app with Vite
- **Production stage**: Serves built files with Express server
- Multi-stage build keeps final image small
- Exposes port 3000

---

## Deploying Docker to Production

### Option A: Docker Hub + Cloud Provider

1. **Push to Docker Hub**:
   ```bash
   docker build -t yourusername/apartment-mgmt-backend:latest ./backend
   docker push yourusername/apartment-mgmt-backend:latest
   ```

2. **Deploy to cloud**:
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

### Option B: Railway.app (Easier)

Railway auto-deploys Docker containers:

1. Connect GitHub repo to Railway
2. Railway auto-detects `Dockerfile`
3. Deploys automatically on git push

### Option C: Render (Recommended)

Render supports both Docker and native deployment:

1. Connect GitHub repo
2. Create Web Service with Docker build method
3. Render builds and deploys automatically

---

## Environment Variables in Docker

### At Runtime

Set environment variables when running:

```bash
docker run -e DATABASE_URL="postgresql://..." -e JWT_SECRET="..." backend
```

### In docker-compose.yml

Variables defined in `docker-compose.yml` `environment` section:

```yaml
environment:
  DATABASE_URL: postgresql://user:pass@postgres:5432/db
  NODE_ENV: production
```

### From .env File

```bash
docker-compose --env-file .env.docker up
```

---

## Docker Best Practices

1. **Use Alpine images** — smaller, faster
2. **Multi-stage builds** — reduces final image size
3. **Layer caching** — put frequently changing layers last
4. **.dockerignore** — exclude unnecessary files
5. **Health checks** — monitor container health
6. **Security** — don't run as root, use read-only filesystems where possible

---

## Troubleshooting

### Container exits immediately
```bash
docker-compose logs backend
# Check error messages
```

### Port already in use
```bash
# Change port in docker-compose.yml or .env
# Or kill existing process
lsof -i :5000
kill -9 <PID>
```

### Database connection fails
```bash
# Check database is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL in .env.docker
```

### Files not updating in container
```bash
# Rebuild container
docker-compose build

# Restart services
docker-compose restart
```

---

## Next Steps

1. ✅ Install Docker and Docker Compose
2. ✅ Create `.env.docker` file
3. ✅ Run `docker-compose up -d`
4. ✅ Test locally at http://localhost:3000
5. ✅ Deploy to cloud using one of the deployment methods

## See Also

- [Render Deployment Guide](./DEPLOYMENT_RENDER.md)
- [PostgreSQL Setup Guide](./POSTGRES_SETUP.md)
- [Security Enhancements Guide](./SECURITY.md)
- [Monitoring Setup Guide](./MONITORING.md)
