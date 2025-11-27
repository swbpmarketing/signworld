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
  // HR Documents
  {
    title: 'Employee Handbook 2024',
    description: 'Complete employee handbook with policies, procedures, and company guidelines',
    fileName: 'employee-handbook-2024.pdf',
    category: 'hr',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/employee-handbook.pdf',
    fileType: 'application/pdf',
    fileSize: 8388608, // 8 MB
    isActive: true,
    tags: ['hr', 'policies', 'handbook', 'onboarding']
  },
  {
    title: 'New Hire Onboarding Checklist',
    description: 'Step-by-step checklist for onboarding new employees',
    fileName: 'onboarding-checklist.docx',
    category: 'hr',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/onboarding-checklist.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 156000,
    isActive: true,
    tags: ['hr', 'onboarding', 'checklist', 'new hire']
  },
  {
    title: 'Benefits Summary Guide',
    description: 'Overview of employee benefits including health insurance, 401k, and PTO policies',
    fileName: 'benefits-summary.pdf',
    category: 'hr',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/benefits-summary.pdf',
    fileType: 'application/pdf',
    fileSize: 2097152,
    isActive: true,
    tags: ['hr', 'benefits', 'insurance', '401k']
  },

  // Marketing Materials
  {
    title: 'Brand Guidelines 2024',
    description: 'Official brand guidelines including logo usage, colors, and typography standards',
    fileName: 'brand-guidelines-2024.pdf',
    category: 'marketing',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/brand-guidelines.pdf',
    fileType: 'application/pdf',
    fileSize: 15728640, // 15 MB
    isActive: true,
    tags: ['branding', 'guidelines', 'logo', 'design']
  },
  {
    title: 'Social Media Templates',
    description: 'Ready-to-use social media post templates for Instagram, Facebook, and LinkedIn',
    fileName: 'social-media-templates.zip',
    category: 'marketing',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/social-templates.zip',
    fileType: 'application/zip',
    fileSize: 52428800, // 50 MB
    isActive: true,
    tags: ['marketing', 'social media', 'templates', 'design']
  },

  // Training Documents
  {
    title: 'Sign Installation Safety Guide',
    description: 'Comprehensive safety procedures and OSHA guidelines for sign installation teams',
    fileName: 'safety-guide.pdf',
    category: 'training',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/safety-guide.pdf',
    fileType: 'application/pdf',
    fileSize: 5242880,
    isActive: true,
    tags: ['safety', 'installation', 'training', 'osha']
  },
  {
    title: 'CNC Router Operation Manual',
    description: 'Complete training manual for operating CNC routers and cutting equipment',
    fileName: 'cnc-operation-manual.pdf',
    category: 'training',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/cnc-manual.pdf',
    fileType: 'application/pdf',
    fileSize: 10485760,
    isActive: true,
    tags: ['training', 'cnc', 'equipment', 'manufacturing']
  },
  {
    title: 'Customer Service Training',
    description: 'Best practices for customer interactions and handling difficult situations',
    fileName: 'customer-service-training.pptx',
    category: 'training',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/customer-service.pptx',
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileSize: 7340032,
    isActive: true,
    tags: ['training', 'customer service', 'presentation']
  },

  // Operations
  {
    title: 'Material Specifications Sheet',
    description: 'Technical specifications for all approved sign materials and substrates',
    fileName: 'material-specs.pdf',
    category: 'operations',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/material-specs.pdf',
    fileType: 'application/pdf',
    fileSize: 3145728,
    isActive: true,
    tags: ['materials', 'specifications', 'technical']
  },
  {
    title: 'Price List 2024',
    description: 'Current pricing structure for all sign products and services',
    fileName: 'price-list-2024.xlsx',
    category: 'operations',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/price-list.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 524288,
    isActive: true,
    tags: ['pricing', 'sales', '2024', 'spreadsheet']
  },
  {
    title: 'Equipment Maintenance Schedule',
    description: 'Daily, weekly, and monthly maintenance checklists for all production equipment',
    fileName: 'maintenance-schedule.xlsx',
    category: 'operations',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/maintenance.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 245760,
    isActive: true,
    tags: ['equipment', 'maintenance', 'operations', 'schedule']
  },
  {
    title: 'Vendor Contact List',
    description: 'Complete contact directory for all approved vendors and suppliers',
    fileName: 'vendor-contacts.xlsx',
    category: 'operations',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/vendors.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 102400,
    isActive: true,
    tags: ['vendors', 'contacts', 'suppliers']
  },

  // Forms & Templates
  {
    title: 'Customer Contract Template',
    description: 'Standard contract template for sign company customer agreements',
    fileName: 'contract-template.docx',
    category: 'forms',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/contract.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 102400,
    isActive: true,
    tags: ['legal', 'contract', 'template', 'forms']
  },
  {
    title: 'Work Order Form',
    description: 'Standard work order form for tracking sign production jobs',
    fileName: 'work-order-form.pdf',
    category: 'forms',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/work-order.pdf',
    fileType: 'application/pdf',
    fileSize: 204800,
    isActive: true,
    tags: ['forms', 'work order', 'production']
  },
  {
    title: 'Installation Completion Certificate',
    description: 'Customer sign-off form for completed sign installations',
    fileName: 'installation-certificate.pdf',
    category: 'forms',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/installation-cert.pdf',
    fileType: 'application/pdf',
    fileSize: 153600,
    isActive: true,
    tags: ['forms', 'installation', 'certificate', 'completion']
  },
  {
    title: 'Quote Request Form',
    description: 'Standardized form for collecting customer quote requests',
    fileName: 'quote-request-form.docx',
    category: 'forms',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/quote-form.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 87040,
    isActive: true,
    tags: ['forms', 'quote', 'sales', 'template']
  },

  // Fonts
  {
    title: 'SignWorld Brand Font Pack',
    description: 'Official SignWorld brand fonts including primary and secondary typefaces',
    fileName: 'signworld-fonts.zip',
    category: 'fonts',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/fonts/signworld-fonts.zip',
    fileType: 'application/zip',
    fileSize: 4194304,
    isActive: true,
    tags: ['fonts', 'typography', 'branding']
  },
  {
    title: 'Sign Industry Font Collection',
    description: 'Popular fonts commonly used in sign design and fabrication',
    fileName: 'sign-industry-fonts.zip',
    category: 'fonts',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/fonts/industry-fonts.zip',
    fileType: 'application/zip',
    fileSize: 12582912,
    isActive: true,
    tags: ['fonts', 'typography', 'design', 'collection']
  },

  // Artwork & Graphics
  {
    title: 'SignWorld Logo Pack',
    description: 'Official SignWorld logos in various formats (AI, EPS, PNG, SVG)',
    fileName: 'signworld-logos.zip',
    category: 'artwork',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/artwork/logos.zip',
    fileType: 'application/zip',
    fileSize: 8388608,
    isActive: true,
    tags: ['artwork', 'logos', 'branding', 'vector']
  },
  {
    title: 'Icon Library',
    description: 'Collection of icons commonly used in sign designs and wayfinding',
    fileName: 'icon-library.zip',
    category: 'artwork',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/artwork/icons.zip',
    fileType: 'application/zip',
    fileSize: 15728640,
    isActive: true,
    tags: ['artwork', 'icons', 'graphics', 'wayfinding']
  },
  {
    title: 'Vehicle Wrap Templates',
    description: 'Standard vehicle wrap templates for common car and truck models',
    fileName: 'vehicle-wrap-templates.zip',
    category: 'artwork',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/artwork/vehicle-wraps.zip',
    fileType: 'application/zip',
    fileSize: 104857600, // 100 MB
    isActive: true,
    tags: ['artwork', 'vehicle wrap', 'templates', 'design']
  },

  // Other
  {
    title: 'Industry Trade Show Calendar 2024',
    description: 'Calendar of sign industry trade shows and events for 2024',
    fileName: 'trade-show-calendar.pdf',
    category: 'other',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/trade-shows.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576,
    isActive: true,
    tags: ['events', 'trade shows', 'calendar', 'industry']
  },
  {
    title: 'Sign Industry Glossary',
    description: 'Comprehensive glossary of sign industry terms and definitions',
    fileName: 'sign-glossary.pdf',
    category: 'other',
    fileUrl: 'https://sign-company-uploads.s3.amazonaws.com/documents/glossary.pdf',
    fileType: 'application/pdf',
    fileSize: 2097152,
    isActive: true,
    tags: ['glossary', 'terminology', 'reference', 'education']
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
