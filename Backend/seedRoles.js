import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './models/Role.js';

dotenv.config();

const defaultRoles = [
  {
    name: 'Support Agent',
    code: 'SUPPORT_AGENT',
    description: 'Customer and driver support operations.',
    isSystem: true,
    permissions: [
      'customer:read', 'driver:read', 'ride:read', 'payment:read', 'audit:read'
    ],
    dataAccess: {
      customerPhone: 'Masked',
      customerEmail: 'Masked',
      driverLocation: 'Approximate',
      paymentInfo: 'No Access'
    }
  },
  {
    name: 'Dispatcher',
    code: 'DISPATCHER',
    description: 'Manage active rides and driver assignment.',
    isSystem: true,
    permissions: [
      'ride:read', 'ride:assign', 'ride:reassign', 'ride:cancel', 'driver:read', 'customer:read'
    ],
    dataAccess: {
      customerPhone: 'No Access',
      customerEmail: 'No Access',
      driverLocation: 'Real-Time',
      paymentInfo: 'No Access'
    }
  },
  {
    name: 'Finance Admin',
    code: 'FINANCE_ADMIN',
    description: 'Manage financial operations.',
    isSystem: true,
    permissions: [
      'payment:read', 'payment:refund', 'payment:reconcile'
    ],
    dataAccess: {
      customerPhone: 'No Access',
      customerEmail: 'No Access',
      driverLocation: 'No Access',
      paymentInfo: 'Full Details'
    }
  },
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Highest level platform administration.',
    isSystem: true,
    permissions: [
      'customer:read', 'customer:create', 'customer:update', 'customer:suspend',
      'driver:read', 'driver:create', 'driver:update', 'driver:suspend', 'driver:approve',
      'ride:read', 'ride:create', 'ride:update', 'ride:cancel', 'ride:assign', 'ride:reassign', 'ride:investigate',
      'payment:read', 'payment:refund', 'payment:reconcile',
      'role:read', 'role:create', 'role:update', 'role:delete',
      'staff:read', 'staff:manage',
      'audit:read'
    ],
    dataAccess: {
      customerPhone: 'Full',
      customerEmail: 'Full',
      driverLocation: 'Real-Time',
      paymentInfo: 'Full Details'
    }
  }
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ code: roleData.code });
      if (!existing) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.code}`);
      } else {
        console.log(`Role already exists: ${roleData.code}`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  }
};

seedRoles();
