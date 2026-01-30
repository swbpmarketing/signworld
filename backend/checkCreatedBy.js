const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkCreatedBy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard');
    console.log('Connected to MongoDB\n');

    // Find the testadmin2 user
    const user = await User.findOne({ email: 'testadmin2@signcompany.com' })
      .populate('createdBy', 'name email')
      .lean();

    if (user) {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('CreatedBy field value:', user.createdBy);
      console.log('\nRaw createdBy ID:', user.createdBy?._id || 'null/undefined');
    } else {
      console.log('User testadmin2 not found');

      // Show all recent users
      const recentUsers = await User.find({})
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      console.log('\nRecent 5 users:');
      recentUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email})`);
        console.log(`  createdBy:`, u.createdBy || 'null');
        console.log('');
      });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCreatedBy();
