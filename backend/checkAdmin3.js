const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard');
    console.log('Connected to MongoDB\n');

    const admin3 = await User.findOne({ email: 'admin3@signcompany.com' })
      .populate('createdBy', 'name email')
      .lean();

    if (admin3) {
      console.log('admin3 found:');
      console.log('Name:', admin3.name);
      console.log('Email:', admin3.email);
      console.log('createdBy (raw):', admin3.createdBy);
      console.log('createdAt:', admin3.createdAt);
      
      // Check the actual document without populate
      const admin3Raw = await User.findOne({ email: 'admin3@signcompany.com' }).lean();
      console.log('\nRaw createdBy field (just ID):', admin3Raw.createdBy);
    } else {
      console.log('admin3 not found');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
