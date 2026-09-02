import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';

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
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    adminUser = new Admin({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'superadmin',
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
