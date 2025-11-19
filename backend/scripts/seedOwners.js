const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample owner data
const sampleOwners = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(602) 555-0123',
    company: 'Arizona Signs & Graphics',
    address: {
      street: '123 Main St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'USA'
    },
    openDate: new Date('2019-01-15'),
    yearsInBusiness: 5,
    specialties: ['Vehicle Wraps', 'LED Signs', 'Monument Signs'],
    equipment: ['Roland Printer', 'Laser Engraver', 'CNC Router'],
    profileImage: '',
    socialLinks: {
      facebook: 'https://facebook.com/arizonasigns',
      linkedin: 'https://linkedin.com/company/arizonasigns',
      website: 'https://arizonasigns.com'
    },
    mentoring: {
      available: true,
      areas: ['Vehicle Wraps', 'Business Development']
    },
    isActive: true
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(206) 555-0456',
    company: 'Pacific Coast Signage',
    address: {
      street: '456 Harbor Blvd',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA'
    },
    openDate: new Date('2018-03-20'),
    yearsInBusiness: 8,
    specialties: ['Digital Displays', 'Wayfinding', 'Corporate Branding'],
    equipment: ['HP Latex Printer', 'Digital Display Systems', 'Vinyl Cutter'],
    profileImage: '',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/pacificcoastsigns',
      instagram: 'https://instagram.com/pacificcoastsigns',
      website: 'https://pacificcoastsigns.com'
    },
    mentoring: {
      available: true,
      areas: ['Digital Signage', 'Technology Integration']
    },
    isActive: true
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(305) 555-0789',
    company: 'Miami Signs International',
    address: {
      street: '789 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      country: 'USA'
    },
    openDate: new Date('2020-06-10'),
    yearsInBusiness: 3,
    specialties: ['Neon Signs', 'Channel Letters', 'Window Graphics'],
    equipment: ['Neon Bending Station', 'Channel Letter Bender', 'Wide Format Printer'],
    profileImage: '',
    socialLinks: {
      facebook: 'https://facebook.com/miamisigns',
      instagram: 'https://instagram.com/miamisigns',
      website: 'https://miamisigns.com'
    },
    mentoring: {
      available: false,
      areas: []
    },
    isActive: true
  },
  {
    name: 'David Martinez',
    email: 'david.martinez@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(512) 555-0234',
    company: 'Texas Premier Signs',
    address: {
      street: '321 Congress Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    },
    openDate: new Date('2017-09-05'),
    yearsInBusiness: 10,
    specialties: ['Monument Signs', 'Pylon Signs', 'ADA Signage'],
    equipment: ['CNC Router', 'Sandblaster', 'Metal Fabrication Tools'],
    profileImage: '',
    socialLinks: {
      facebook: 'https://facebook.com/texaspremiersigns',
      linkedin: 'https://linkedin.com/company/texaspremiersigns',
      website: 'https://texaspremiersigns.com'
    },
    mentoring: {
      available: true,
      areas: ['Monument Signs', 'ADA Compliance', 'Business Management']
    },
    isActive: true
  },
  {
    name: 'Jennifer Williams',
    email: 'jennifer.williams@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(415) 555-0567',
    company: 'Bay Area Sign Solutions',
    address: {
      street: '555 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA'
    },
    openDate: new Date('2019-11-12'),
    yearsInBusiness: 6,
    specialties: ['Architectural Signage', 'Retail Displays', 'Dimensional Letters'],
    equipment: ['Laser Cutter', 'UV Printer', 'Embossing Machine'],
    profileImage: '',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/bayareasigns',
      instagram: 'https://instagram.com/bayareasigns',
      website: 'https://bayareasigns.com'
    },
    mentoring: {
      available: true,
      areas: ['Design', 'Retail Signage']
    },
    isActive: true
  },
  {
    name: 'Robert Thompson',
    email: 'robert.thompson@example.com',
    password: 'Password123!',
    role: 'owner',
    phone: '(404) 555-0890',
    company: 'Atlanta Sign Company',
    address: {
      street: '777 Peachtree St',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30308',
      country: 'USA'
    },
    openDate: new Date('2016-04-18'),
    yearsInBusiness: 12,
    specialties: ['Fleet Graphics', 'Building Wraps', 'Trade Show Displays'],
    equipment: ['Roland Printer', 'Laminator', 'Plotter'],
    profileImage: '',
    socialLinks: {
      facebook: 'https://facebook.com/atlantasignco',
      website: 'https://atlantasignco.com'
    },
    mentoring: {
      available: true,
      areas: ['Fleet Graphics', 'Large Format Printing']
    },
    isActive: true
  }
];

// Seed function
const seedOwners = async () => {
  try {
    await connectDB();

    console.log('Clearing existing owners...');
    await User.deleteMany({ role: 'owner' });

    console.log('Seeding new owners...');
    const owners = await User.create(sampleOwners);

    console.log(`✅ Successfully created ${owners.length} owner users!`);
    console.log('\nSample login credentials:');
    console.log('Email: sarah.johnson@example.com');
    console.log('Password: Password123!');
    console.log('\nAll sample owners use the same password: Password123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding owners:', error);
    process.exit(1);
  }
};

// Run seeder
seedOwners();
