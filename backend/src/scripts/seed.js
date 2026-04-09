require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@dabc-euphorbia.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Association Admin';

const BLOCK = '1A';
const TOTAL_UNITS = 19;

const seedFlats = async () => {
  let created = 0;
  for (let i = 1; i <= TOTAL_UNITS; i++) {
    const exists = await prisma.flat.findFirst({ where: { block: BLOCK, unitNumber: i } });
    if (!exists) {
      await prisma.flat.create({ data: { block: BLOCK, unitNumber: i } });
      created++;
    }
  }
  console.log(`Flats: ${created} created, ${TOTAL_UNITS - created} already exist`);
};

const seedAdmin = async () => {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: { name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'Admin', status: 'active' },
  });
  console.log(`Admin created: ${ADMIN_EMAIL}`);
};

const run = async () => {
  try {
    await seedFlats();
    await seedAdmin();
    console.log('Seed complete.');
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});



