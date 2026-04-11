require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

// Run migrations and generate Prisma client before connecting
async function startServer() {
  try {
    // Check if Prisma client is generated
    const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
    if (!fs.existsSync(prismaClientPath)) {
      console.log('Generating Prisma Client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
    }
    
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
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

