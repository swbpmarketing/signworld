const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

const fixEmailVerification = async () => {
  try {
    console.log('🔧 Fixing email verification for all existing users...\n');

    // Update all users to have emailVerified: true
    const result = await User.updateMany(
      { emailVerified: { $ne: true } },  // Find all users that aren't already verified
      { $set: { emailVerified: true, isActive: true } }   // Set them as verified and active
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log(`📊 Matched ${result.matchedCount} users\n`);

    // Show all users that can now login
    const allUsers = await User.find({}, 'email name role emailVerified isActive');

    console.log('📋 All users that can now login:\n');
    allUsers.forEach(user => {
      const status = user.emailVerified && user.isActive ? '✅' : '❌';
      console.log(`${status} ${user.email} (${user.role})`);
    });

    console.log('\n✨ All users are now verified and can login!');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing email verification:', error);
    process.exit(1);
  }
};

fixEmailVerification();
