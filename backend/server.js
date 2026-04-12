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

// Run migrations on startup
async function startServer() {
  try {
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('Migrations completed');
  } catch (err) {
    console.log('Migration info:', err.message);
  }

  // Verify DB connection then start server
  prisma.$connect()
    .then(() => {
      console.log('Database connected via Prisma');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Database connection error:', err.message);
      process.exit(1);
    });
}

startServer();

