require('dotenv').config({ path: './backend/.env' });

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Open DevTools (F12) → Application → Cookies');
console.log('2. Find the "token" cookie');
console.log('3. Copy its value');
console.log('4. Run: node check-current-user.js <paste-token-here>');
console.log('===================\n');

if (process.argv[2]) {
  const jwt = require('jsonwebtoken');
  const mongoose = require('mongoose');
  
  (async () => {
    try {
      const token = process.argv[2];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('Token decoded successfully!');
      console.log('User ID from token:', decoded.id);
      console.log('Role from token:', decoded.role);
      console.log('\nChecking database...\n');
      
      await mongoose.connect(process.env.MONGODB_URI);
      const User = require('./backend/models/User');
      
      const user = await User.findById(decoded.id);
      if (user) {
        console.log('✅ User found in database:');
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   ID:', user._id);
        
        if (decoded.role !== user.role) {
          console.log('\n⚠️  WARNING: Token role and database role mismatch!');
          console.log('   Token role:', decoded.role);
          console.log('   Database role:', user.role);
          console.log('   → User needs to log out and log back in');
        }
      } else {
        console.log('❌ User not found in database');
      }
      
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
    }
  })();
}
