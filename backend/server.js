require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// Generate Prisma client BEFORE any other requires
console.log('Checking/generating Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('Prisma Client ready');
} catch (err) {
  console.log('Note: Prisma generation attempted:', err.message);
}

// NOW require the rest
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

// Run migrations on startup (non-blocking)
async function runMigrations() {
  try {
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✓ Migrations completed');
  } catch (err) {
    console.log('⚠ Migration issue detected, attempting resolve...');
    try {
      // Try to resolve failed migrations
      execSync('npx prisma migrate resolve --rolled-back 20260408175332_init', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      // Try again
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('✓ Migrations resolved and completed');
    } catch (resolveErr) {
      console.log('⚠ Migration warning:', resolveErr.message);
    }
  }
}

// Connect and start server
async function startServer() {
  // Run migrations in background (don't block startup)
  runMigrations().catch(err => console.log('Migration error:', err.message));

  // Verify DB connection then start server
  prisma.$connect()
    .then(() => {
      console.log('✓ Database connected via Prisma');
      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('✗ Database connection error:', err.message);
      console.log('Retrying in 5 seconds...');
      setTimeout(startServer, 5000);
    });
}

startServer();

