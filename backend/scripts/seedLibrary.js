const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LibraryFile = require('../models/LibraryFile');

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

// Sample library files (will add uploadedBy dynamically)
const sampleFilesTemplate = [
  {
    title: 'Marketing Templates Pack',
    description: 'Complete collection of marketing materials including flyers, brochures, and social media templates',
    fileName: 'marketing-templates.zip',
    category: 'marketing',
    fileUrl: 'https://example.com/files/marketing-templates.zip',
    fileType: 'zip',
    fileSize: 25600000, // 25.6 MB
    isActive: true,
    tags: ['marketing', 'templates', 'design']
  },
  {
    title: 'Sign Installation Safety Guide',
    description: 'Comprehensive safety procedures and guidelines for sign installation teams',
    fileName: 'safety-guide.pdf',
    category: 'training',
    fileUrl: 'https://example.com/files/safety-guide.pdf',
    fileType: 'pdf',
    fileSize: 5242880, // 5 MB
    isActive: true,
    tags: ['safety', 'installation', 'training']
  },
  {
    title: 'Brand Guidelines 2024',
    description: 'Official brand guidelines including logo usage, colors, and typography',
    fileName: 'brand-guidelines.pdf',
    category: 'marketing',
    fileUrl: 'https://example.com/files/brand-guidelines.pdf',
    fileType: 'pdf',
    fileSize: 12582912, // 12 MB
    isActive: true,
    tags: ['branding', 'guidelines', 'logo']
  },
  {
    title: 'Customer Contract Template',
    description: 'Standard contract template for sign company customer agreements',
    fileName: 'contract-template.docx',
    category: 'forms',
    fileUrl: 'https://example.com/files/contract-template.docx',
    fileType: 'docx',
    fileSize: 102400, // 100 KB
    isActive: true,
    tags: ['legal', 'contract', 'template']
  },
  {
    title: 'Material Specifications Sheet',
    description: 'Technical specifications for all approved sign materials and substrates',
    fileName: 'material-specs.pdf',
    category: 'operations',
    fileUrl: 'https://example.com/files/material-specs.pdf',
    fileType: 'pdf',
    fileSize: 3145728, // 3 MB
    isActive: true,
    tags: ['materials', 'specifications', 'technical']
  },
  {
    title: 'Price List 2024',
    description: 'Current pricing structure for all sign products and services',
    fileName: 'price-list-2024.xlsx',
    category: 'operations',
    fileUrl: 'https://example.com/files/price-list-2024.xlsx',
    fileType: 'xlsx',
    fileSize: 524288, // 512 KB
    isActive: true,
    tags: ['pricing', 'sales', '2024']
  },
  {
    title: 'Equipment Maintenance Checklist',
    description: 'Daily and weekly maintenance checklists for all sign production equipment',
    fileName: 'maintenance-checklist.pdf',
    category: 'operations',
    fileUrl: 'https://example.com/files/maintenance-checklist.pdf',
    fileType: 'pdf',
    fileSize: 1048576, // 1 MB
    isActive: true,
    tags: ['equipment', 'maintenance', 'operations']
  }
];

// Seed function
const seedLibrary = async () => {
  try {
    await connectDB();

    // Find or create an admin user to be the uploader
    const User = require('../models/User');
    let uploader = await User.findOne({ role: 'admin' });

    if (!uploader) {
      // Try to find any user
      uploader = await User.findOne({ role: 'owner' });
    }

    if (!uploader) {
      console.log('No users found in database. Please run seed:owners or seed:admin first.');
      process.exit(1);
    }

    console.log(`Using ${uploader.name} as file uploader`);

    // Add uploadedBy to all files
    const sampleFiles = sampleFilesTemplate.map(file => ({
      ...file,
      uploadedBy: uploader._id
    }));

    console.log('Clearing existing library files...');
    await LibraryFile.deleteMany({});

    console.log('Seeding new library files...');
    const files = await LibraryFile.create(sampleFiles);

    console.log(`✅ Successfully created ${files.length} library files!`);
    console.log('\nLibrary files have been added to the database.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding library files:', error);
    process.exit(1);
  }
};

// Run seeder
seedLibrary();
