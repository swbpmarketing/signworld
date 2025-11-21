const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard';

async function createAdminUser() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@signworld.com' });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@signworld.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@signworld.com');
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminUser();
