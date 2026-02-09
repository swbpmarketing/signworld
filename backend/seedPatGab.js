const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/../.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

const seedPatGab = async () => {
  try {
    const users = [
      {
        name: 'Pat',
        email: 'pat@signcompany.com',
        password: 'pat123',
        role: 'admin',
        phone: '555-555-0101',
        company: 'Sign Company HQ',
        address: { city: 'New York', state: 'NY', country: 'USA' },
        emailVerified: true,
        isActive: true,
      },
      {
        name: 'Gab',
        email: 'gab@signcompany.com',
        password: 'gab123',
        role: 'admin',
        phone: '555-555-0102',
        company: 'Sign Company HQ',
        address: { city: 'New York', state: 'NY', country: 'USA' },
        emailVerified: true,
        isActive: true,
      },
    ];

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`${userData.name} (${userData.email}) already exists, skipping.`);
        continue;
      }
      await User.create(userData);
      console.log(`Created admin user: ${userData.name} (${userData.email}) / ${userData.password}`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Pat & Gab:', error);
    process.exit(1);
  }
};

seedPatGab();
