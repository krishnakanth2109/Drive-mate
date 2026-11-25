import 'dotenv/config';
import { prisma, connectPrisma } from '../config/prisma.js';

async function listAllLogins() {
  await connectPrisma();

  console.log('\n========================================================================');
  console.log('👑 1. MASTER ADMIN PORTAL (http://localhost:5173/master)');
  console.log('========================================================================');
  const admins = await prisma.admin.findMany({
    include: { adminRoles: { include: { role: true } } },
  });
  for (const a of admins) {
    const roleNames = a.adminRoles.map((r: any) => r.role.name).join(', ') || 'ADMIN';
    console.log(`• Email: ${a.email} | Password: admin123 | Name: ${a.name} | Role: ${roleNames}`);
  }

  console.log('\n========================================================================');
  console.log('🚗 2. DRIVER / RIDER APP (RiderApp / Mobile)');
  console.log('========================================================================');
  const riders = await prisma.rider.findMany({
    select: { email: true, name: true, phone: true, vehicleType: true },
    take: 10,
  });
  for (const r of riders) {
    console.log(`• Email: ${r.email} | Phone: ${r.phone} | Password: Password@123 | Name: ${r.name} | Vehicle: ${r.vehicleType}`);
  }

  console.log('\n========================================================================');
  console.log('👥 3. COMMUTER / CUSTOMER (CustomerApp & Web: http://localhost:5173/login)');
  console.log('========================================================================');
  const customers = await prisma.customer.findMany({
    select: { email: true, name: true, phone: true, walletBalance: true },
    take: 10,
  });
  for (const c of customers) {
    console.log(`• Email: ${c.email} | Phone: ${c.phone} | Password: Password@123 | Name: ${c.name} | Balance: ₹${c.walletBalance}`);
  }

  console.log('\n========================================================================\n');
  await prisma.$disconnect();
}

listAllLogins().catch(console.error);
