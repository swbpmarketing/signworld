const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/../.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@signcompany.com' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user (password will be hashed by User model pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@signcompany.com',
      password: 'admin123',
      role: 'admin',
      phone: '555-555-0100',
      company: 'Sign Company HQ',
      address: {
        city: 'New York',
        state: 'NY',
        country: 'USA',
      },
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@signcompany.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();