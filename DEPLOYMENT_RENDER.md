# Deployment to Render.com - Setup Guide

## Overview
This guide explains how to deploy the Apartment Management System to Render using the `render.yaml` configuration file.

The deployment includes:
- **Backend**: Node.js/Express API (port 5000)
- **Frontend**: React application (Vite)

## Prerequisites
- GitHub account with the repository pushed
- Render account (https://render.com)
- Environment variables configured

## Step 1: Prepare Backend Environment Variables

Create a `.env` file in the `backend/` directory with production values:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# Email Configuration (Gmail or your SMTP provider)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=no-reply@dabc-euphorbia.com

# Client Origin (will be updated after frontend deployment)
CLIENT_ORIGIN=https://apartment-mgmt-frontend.onrender.com
```

**Important**: For Gmail, use an App Password instead of your regular password. See: https://support.google.com/accounts/answer/185833

## Step 2: Create Render Account and Connect GitHub

1. Go to https://render.com and sign up
2. In dashboard, click **New +** → **Blueprint** (Infrastructure as Code)
3. Select your GitHub repository: `kbsubaash/ApartmentMgmt`
4. Authorize Render to access your GitHub

## Step 3: Deploy Using render.yaml

1. Render will automatically detect `render.yaml` in the repository root
2. Review the services configuration:
   - **Backend service**: `apartment-mgmt-backend`
   - **Frontend service**: `apartment-mgmt-frontend`
3. Click **Apply** to deploy

This will create two web services and deploy them simultaneously.

## Step 4: Configure Environment Variables on Render

### For Backend Service

1. Go to Dashboard → `apartment-mgmt-backend` service
2. Click **Environment**
3. Add the following environment variables:

| Key | Value | Type |
|-----|-------|------|
| `NODE_ENV` | `production` | Standard |
| `DATABASE_URL` | `file:./prisma/prod.db` | Standard |
| `JWT_SECRET` | (generate a strong random string) | Secret |
| `JWT_EXPIRY` | `7d` | Standard |
| `MAIL_HOST` | `smtp.gmail.com` | Standard |
| `MAIL_PORT` | `587` | Standard |
| `MAIL_USER` | (your email) | Secret |
| `MAIL_PASS` | (your app password) | Secret |
| `MAIL_FROM` | `no-reply@dabc-euphorbia.com` | Standard |
| `CLIENT_ORIGIN` | (add frontend URL after it deploys) | Standard |

4. Click **Save** and the service will redeploy

### For Frontend Service

1. Go to Dashboard → `apartment-mgmt-frontend` service
2. Click **Environment**
3. Add the following:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | (your backend service URL, e.g., `https://apartment-mgmt-backend.onrender.com`) |

4. Click **Save**

## Step 5: Update Frontend API Configuration

After frontend deploys, verify the API base URL in:

**`frontend/src/api/axios.js`**

```javascript
const baseURL = process.env.VITE_API_BASE_URL || 'https://apartment-mgmt-backend.onrender.com';
```

## Step 6: Get Service URLs

After both services deploy:

- **Backend URL**: `https://apartment-mgmt-backend.onrender.com`
- **Frontend URL**: `https://apartment-mgmt-frontend.onrender.com`

## Step 7: Test the Deployment

1. Open the frontend URL in browser: `https://apartment-mgmt-frontend.onrender.com`
2. Try logging in with:
   - Email: `admin@dabc-euphorbia.com`
   - Password: `Admin@1234`
3. Check backend health: `https://apartment-mgmt-backend.onrender.com/api/health`

## Step 8: Enable Auto-Deploy

The `render.yaml` has `autoDeploy: true` configured, so:
- Any push to the `main` branch will trigger automatic deployment
- Deployments take 5-10 minutes typically

## Database Considerations

- The current setup uses SQLite with file storage
- On Render's free tier, the database file may not persist between deployments
- **Recommended for production**: Migrate to PostgreSQL

To use PostgreSQL on Render:

1. Create a PostgreSQL database on Render (separate service)
2. Update `DATABASE_URL` in backend with PostgreSQL connection string
3. Update `prisma/schema.prisma` to use PostgreSQL provider
4. Run migrations on deploy

## Troubleshooting

### Backend Build/Deploy Fails
- Check logs: Service → **Logs** tab
- Ensure `.env` variables are configured
- Verify `backend/package.json` has correct scripts

### Frontend Fails to Load
- Check browser console for API errors
- Ensure `VITE_API_BASE_URL` points to correct backend URL
- Verify backend is running and CORS is enabled

### Login Fails
- Check that backend database is initialized
- Run seed script manually if needed
- Check email/password credentials

### Database Lost After Redeploy
- Render's free tier doesn't persist file-based databases
- Use PostgreSQL on Render free tier instead

## Manual Deployment (Alternative)

If Blueprint fails, deploy manually:

1. **Backend**: 
   - Create Web Service
   - GitHub repo: `kbsubaash/ApartmentMgmt`
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm run start`

2. **Frontend**:
   - Create Web Service
   - GitHub repo: `kbsubaash/ApartmentMgmt`
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview`

## Next Steps

After deployment:
1. Share frontend URL with apartment owners
2. Set up custom domain (if desired)
3. Monitor logs for errors
4. Consider upgrading to paid tier for production use
5. Set up automated backups if using database

## Support

- Render Docs: https://render.com/docs
- Vite Docs: https://vitejs.dev
- Express Docs: https://expressjs.com
- Prisma Docs: https://www.prisma.io/docs
