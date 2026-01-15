const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Rating = require('./models/Rating');

dotenv.config({ path: '../.env' });

const sampleOwners = [
  {
    name: 'John Smith',
    email: 'john.smith@signtech.com',
    password: 'password123',
    role: 'owner',
    phone: '5550000101',
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
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@creativesigns.com',
    password: 'password123',
    role: 'owner',
    phone: '5550000102',
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
    password: 'password123',
    role: 'owner',
    phone: '5550000103',
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
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@urbanvisual.com',
    password: 'password123',
    role: 'owner',
    phone: '5550000104',
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
    isActive: true,
    emailVerified: true
  },
  {
    name: 'David Thompson',
    email: 'david.thompson@neonworks.com',
    password: 'password123',
    role: 'owner',
    phone: '5550000105',
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
    isActive: true,
    emailVerified: true
  }
];

const sampleReviews = [
  {
    ownerIndex: 0, // John Smith
    reviewer: {
      name: 'Lisa Wilson',
      email: 'lisa.wilson@example.com',
      password: 'password123',
      role: 'owner'
    },
    rating: 5,
    comment: 'Excellent work on our storefront sign. Professional service and great attention to detail.',
    status: 'approved',
    isPublished: true
  },
  {
    ownerIndex: 0, // John Smith
    reviewer: {
      name: 'Tom Baker',
      email: 'tom.baker@example.com',
      password: 'password123',
      role: 'owner'
    },
    rating: 4,
    comment: 'Good quality work, delivered on time. Would recommend for digital signage projects.',
    status: 'approved',
    isPublished: true
  },
  {
    ownerIndex: 1, // Sarah Johnson
    reviewer: {
      name: 'Mark Davis',
      email: 'mark.davis@example.com',
      password: 'password123',
      role: 'owner'
    },
    rating: 5,
    comment: 'Amazing vehicle wrap! The design exceeded our expectations and installation was flawless.',
    status: 'approved',
    isPublished: true
  },
  {
    ownerIndex: 1, // Sarah Johnson
    reviewer: {
      name: 'Jennifer Lee',
      email: 'jennifer.lee@example.com',
      password: 'password123',
      role: 'owner'
    },
    rating: 4,
    comment: 'Great customer service and quality work. Very satisfied with our trade show display.',
    status: 'approved',
    isPublished: true
  },
  {
    ownerIndex: 2, // Mike Rodriguez
    reviewer: {
      name: 'Robert Green',
      email: 'robert.green@example.com',
      password: 'password123',
      role: 'owner'
    },
    rating: 5,
    comment: 'Outstanding large format printing quality. Has been our go-to printer for 3 years.',
    status: 'approved',
    isPublished: true
  }
];

const seedOwners = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing owner data...');
    // Remove existing owners and their ratings
    const existingOwners = await User.find({ role: 'owner' });
    const ownerIds = existingOwners.map(owner => owner._id);
    
    await Rating.deleteMany({ owner: { $in: ownerIds } });
    await User.deleteMany({ role: 'owner' });

    console.log('Creating sample owners...');
    const createdOwners = [];
    
    for (const ownerData of sampleOwners) {
      const salt = await bcrypt.genSalt(10);
      ownerData.password = await bcrypt.hash(ownerData.password, salt);
      
      const owner = await User.create(ownerData);
      createdOwners.push(owner);
      console.log(`Created owner: ${owner.name} (${owner.company})`);
    }

    console.log('Creating sample reviewers and reviews...');
    for (const reviewData of sampleReviews) {
      // Create reviewer if not exists
      let reviewer = await User.findOne({ email: reviewData.reviewer.email });
      if (!reviewer) {
        const salt = await bcrypt.genSalt(10);
        reviewData.reviewer.password = await bcrypt.hash(reviewData.reviewer.password, salt);
        reviewData.reviewer.emailVerified = true; // Seed reviewers are pre-verified
        reviewer = await User.create(reviewData.reviewer);
        console.log(`Created reviewer: ${reviewer.name}`);
      }

      // Create review
      const owner = createdOwners[reviewData.ownerIndex];
      const review = await Rating.create({
        owner: owner._id,
        reviewer: reviewer._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        status: reviewData.status,
        isPublished: reviewData.isPublished
      });
      
      console.log(`Created review for ${owner.name} by ${reviewer.name}`);
    }

    console.log('\nSeed data created successfully!');
    console.log(`Created ${createdOwners.length} owners`);
    console.log(`Created ${sampleReviews.length} reviews`);
    
    console.log('\nSample owner IDs for testing:');
    createdOwners.forEach((owner, index) => {
      console.log(`${index + 1}. ${owner.name} (${owner.company}) - ID: ${owner._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedOwners();
}

module.exports = { seedOwners, sampleOwners };