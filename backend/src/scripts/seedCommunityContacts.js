require('dotenv').config();
const prisma = require('../config/prisma');

const DEFAULT_CONTACTS = [
  { category: 'Electrician',       icon: '⚡', name: 'Association Electrician', phone: '', order: 1 },
  { category: 'Plumber',           icon: '🔧', name: 'Association Plumber',     phone: '', order: 2 },
  { category: 'Housekeeping',      icon: '🧹', name: 'Housekeeping In-charge',  phone: '', order: 3 },
  { category: 'Security',          icon: '🛡️', name: 'Security Guard',          phone: '', order: 4 },
  { category: 'Hospital',          icon: '🏥', name: 'Nearest Hospital',        phone: '', order: 5 },
  { category: 'Ambulance',         icon: '🚑', name: 'Ambulance',               phone: '108',  order: 6 },
  { category: 'Fire Service',      icon: '🚒', name: 'Fire Service',            phone: '101',  order: 7 },
  { category: 'Police',            icon: '👮', name: 'Local Police Station',    phone: '100',  order: 8 },
  { category: 'Post Office',       icon: '📮', name: 'Nearest Post Office',     phone: '', order: 9 },
  { category: 'Local Councillor',  icon: '🏛️', name: 'Ward Councillor',         phone: '', order: 10 },
  { category: 'Panchayat Head',    icon: '🏘️', name: 'Panchayat President',     phone: '', order: 11 },
  { category: 'Auto Rickshaw',     icon: '🛺', name: 'Auto Rickshaw Stand',     phone: '', order: 12 },
  { category: 'Cab Provider',      icon: '🚕', name: 'Cab Provider',            phone: '', order: 13 },
  { category: 'Medical Shop',      icon: '💊', name: 'Nearest Medical Shop',    phone: '', order: 14 },
  { category: 'Ironing Shop',      icon: '👔', name: 'Ironing Shop',            phone: '', order: 15 },
  { category: 'Internet Provider', icon: '🌐', name: 'Internet Provider',       phone: '', order: 16 },
  { category: 'EB / Electricity Board', icon: '💡', name: 'EB Office',         phone: '', order: 17 },
];

async function main() {
  let created = 0;
  for (const c of DEFAULT_CONTACTS) {
    const exists = await prisma.communityContact.findFirst({ where: { category: c.category } });
    if (!exists) {
      await prisma.communityContact.create({ data: c });
      created++;
    }
  }
  console.log(`Community contacts: ${created} created, ${DEFAULT_CONTACTS.length - created} already exist`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
