const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Rating = require('./models/Rating');

// Load environment variables
dotenv.config();

const productionOwners = [
  {
    name: 'John Smith',
    email: 'john.smith@signtech.com',
    password: 'SignTech2024!',
    role: 'owner',
    phone: '(512) 555-0101',
    company: 'SignTech Solutions',
    address: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    },
    openDate: new Date('2018-03-15'),
    specialties: ['Digital Signage', 'LED Displays', 'Vinyl Graphics'],
    equipment: ['Roland VersaCAMM', 'HP Latex Printer', 'Graphtec Plotter'],
    yearsInBusiness: 6,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://signtechsolutions.com',
      facebook: 'https://facebook.com/signtechsolutions',
      linkedin: 'https://linkedin.com/company/signtechsolutions'
    },
    mentoring: {
      available: true,
      areas: ['Digital Printing', 'Business Management', 'Equipment Training']
    },
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@creativesigns.com',
    password: 'Creative2024!',
    role: 'owner',
    phone: '(214) 555-0102',
    company: 'Creative Signs & Graphics',
    address: {
      street: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      country: 'USA'
    },
    openDate: new Date('2015-08-20'),
    specialties: ['Vehicle Wraps', 'Storefront Signs', 'Trade Show Displays'],
    equipment: ['3M Wrap Equipment', 'Summa Plotter', 'Mimaki Printer'],
    yearsInBusiness: 9,
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b8e5?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://creativesignsgraphics.com',
      instagram: 'https://instagram.com/creativesignsgraphics'
    },
    mentoring: {
      available: true,
      areas: ['Vehicle Wrapping', 'Design Software', 'Customer Relations']
    },
    isActive: true
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@precisionprints.com',
    password: 'Precision2024!',
    role: 'owner',
    phone: '(713) 555-0103',
    company: 'Precision Prints',
    address: {
      street: '789 Commerce Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    },
    openDate: new Date('2012-01-10'),
    specialties: ['Large Format Printing', 'Banners', 'Construction Signs'],
    equipment: ['HP Scitex', 'Zünd Cutter', 'Durst Printer'],
    yearsInBusiness: 12,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://precisionprints.com',
      linkedin: 'https://linkedin.com/in/mikerodriguez'
    },
    mentoring: {
      available: false,
      areas: []
    },
    isActive: true
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@urbanvisual.com',
    password: 'Urban2024!',
    role: 'owner',
    phone: '(210) 555-0104',
    company: 'Urban Visual Solutions',
    address: {
      street: '321 Design Way',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78205',
      country: 'USA'
    },
    openDate: new Date('2019-06-01'),
    specialties: ['Architectural Signs', 'Wayfinding', 'ADA Compliance'],
    equipment: ['Epilog Laser', 'CNC Router', 'UV Printer'],
    yearsInBusiness: 5,
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://urbanvisual.com',
      instagram: 'https://instagram.com/urbanvisual',
      facebook: 'https://facebook.com/urbanvisual'
    },
    mentoring: {
      available: true,
      areas: ['Design Concepts', 'ADA Compliance', 'Project Management']
    },
    isActive: true
  },
  {
    name: 'David Thompson',
    email: 'david.thompson@neonworks.com',
    password: 'Neon2024!',
    role: 'owner',
    phone: '(817) 555-0105',
    company: 'Neon Works',
    address: {
      street: '654 Electric St',
      city: 'Fort Worth',
      state: 'TX',
      zipCode: '76102',
      country: 'USA'
    },
    openDate: new Date('2010-11-15'),
    specialties: ['Neon Signs', 'LED Neon', 'Custom Lighting'],
    equipment: ['Glass Bending Tools', 'Neon Transformers', 'LED Strip Equipment'],
    yearsInBusiness: 14,
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://neonworks.com',
      facebook: 'https://facebook.com/neonworks'
    },
    mentoring: {
      available: true,
      areas: ['Neon Fabrication', 'Electrical Work', 'Traditional Techniques']
    },
    isActive: true
  },
  {
    name: 'Jessica Martinez',
    email: 'jessica.martinez@elitesigns.com',
    password: 'Elite2024!',
    role: 'owner',
    phone: '(915) 555-0106',
    company: 'Elite Signs & Graphics',
    address: {
      street: '987 Business Park Dr',
      city: 'El Paso',
      state: 'TX',
      zipCode: '79901',
      country: 'USA'
    },
    openDate: new Date('2017-04-12'),
    specialties: ['Monument Signs', 'Channel Letters', 'Window Graphics'],
    equipment: ['MultiCam CNC Router', 'Gerber Edge FX', 'Canon ImagePROGRAF'],
    yearsInBusiness: 7,
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://elitesignselpaso.com',
      instagram: 'https://instagram.com/elitesignsep'
    },
    mentoring: {
      available: true,
      areas: ['Monument Design', 'Permitting Process', 'Client Management']
    },
    isActive: true
  },
  {
    name: 'Robert Wilson',
    email: 'robert.wilson@metroprintsigns.com',
    password: 'Metro2024!',
    role: 'owner',
    phone: '(469) 555-0107',
    company: 'MetroPrint Signs',
    address: {
      street: '543 Print Plaza',
      city: 'Plano',
      state: 'TX',
      zipCode: '75074',
      country: 'USA'
    },
    openDate: new Date('2014-09-08'),
    specialties: ['Real Estate Signs', 'Yard Signs', 'Magnetic Signs'],
    equipment: ['Flatbed UV Printer', 'Laminator', 'Die Cutting Machine'],
    yearsInBusiness: 10,
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://metroprintsigns.com',
      linkedin: 'https://linkedin.com/company/metroprintsigns'
    },
    mentoring: {
      available: false,
      areas: []
    },
    isActive: true
  },
  {
    name: 'Amanda Foster',
    email: 'amanda.foster@coastalsigns.com',
    password: 'Coastal2024!',
    role: 'owner',
    phone: '(361) 555-0108',
    company: 'Coastal Signs & Design',
    address: {
      street: '789 Beach Blvd',
      city: 'Corpus Christi',
      state: 'TX',
      zipCode: '78401',
      country: 'USA'
    },
    openDate: new Date('2020-02-14'),
    specialties: ['Marine Signs', 'Outdoor Durability', 'Custom Flags'],
    equipment: ['Weather-resistant Printers', 'Marine-grade Materials', 'Flag Equipment'],
    yearsInBusiness: 4,
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    socialLinks: {
      website: 'https://coastalsignscc.com',
      facebook: 'https://facebook.com/coastalsignscc'
    },
    mentoring: {
      available: true,
      areas: ['Coastal Weather Considerations', 'Marine Industry', 'Startup Guidance']
    },
    isActive: true
  }
];

async function seedProductionOwners() {
  try {
    // Connect to database using environment variable
    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Database connection string not found in environment variables');
    }

    console.log('Connecting to production database...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // Check if owners already exist
    const existingOwners = await User.countDocuments({ role: 'owner' });
    
    if (existingOwners > 0) {
      console.log(`Found ${existingOwners} existing owners. Skipping seed to avoid duplicates.`);
      console.log('If you want to reseed, please manually clear the owner data first.');
      process.exit(0);
    }

    console.log('No existing owners found. Creating production owners...');
    
    let createdCount = 0;
    for (const ownerData of productionOwners) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(ownerData.password, 10);
        const owner = await User.create({
          ...ownerData,
          password: hashedPassword,
          emailVerified: true // Seeded owners are pre-verified
        });
        
        console.log(`✓ Created owner: ${owner.name} (${owner.company})`);
        createdCount++;
      } catch (error) {
        console.error(`✗ Failed to create owner ${ownerData.name}:`, error.message);
      }
    }

    console.log(`\nSeeding completed! Created ${createdCount} out of ${productionOwners.length} owners.`);
    
    // Verify the data
    const totalOwners = await User.countDocuments({ role: 'owner' });
    console.log(`Total owners in database: ${totalOwners}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production owners:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedProductionOwners();
}

module.exports = seedProductionOwners;