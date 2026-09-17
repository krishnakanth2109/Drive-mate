import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import Role from './models/Role.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const adminEmail = 'admin@drivemate.com';
    
    // Check if admin exists
    let adminUser = await Admin.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('Admin user already exists in Admin collection!');
      
      // Update existing admin to have SUPER_ADMIN role if missing
      const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });
      if (superAdminRole && (!adminUser.roles || !adminUser.roles.includes(superAdminRole._id))) {
        adminUser.roles = [superAdminRole._id];
        await adminUser.save();
        console.log('✅ Updated existing admin with SUPER_ADMIN role');
      }
      
      console.log('Email:', adminEmail);
      console.log('Password: adminpassword123');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });

    adminUser = new Admin({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      roles: superAdminRole ? [superAdminRole._id] : [],
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully in dedicated Admin collection!');
    console.log('Email:', adminEmail);
    console.log('Password: adminpassword123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
