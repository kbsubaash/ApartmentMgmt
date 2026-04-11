require('dotenv').config();
const { execSync } = require('child_process');
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

// Run migrations before connecting
async function startServer() {
  try {
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

