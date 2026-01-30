const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  name: String
});

const User = mongoose.model('User', userSchema, 'users');

async function updateUserRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await User.findOneAndUpdate(
      { email: 'admin@signcompany.com' },
      { role: 'admin' },
      { new: true }
    );
    
    console.log('User updated successfully:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateUserRole();
