const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ email: 'admin@signcompany.com' }).select('+password');

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log('   emailVerified:', user.emailVerified);
    console.log('   isActive:', user.isActive);
    console.log('\n🔑 Testing password match...');

    const isMatch = await user.matchPassword('admin123');

    if (isMatch) {
      console.log('✅ Password is correct!');

      // Try generating token
      const generateToken = require('./utils/generateToken');
      const token = generateToken(user._id, user.role);
      console.log('✅ Token generated:', token.substring(0, 20) + '...');
      console.log('\n✅✅✅ LOGIN SHOULD WORK ✅✅✅');
    } else {
      console.log('❌ Password is incorrect!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
