const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Partner = require('../models/Partner');

const vendorPartners = [
  {
    user: {
      name: 'Mike Thompson',
      email: 'mike@signsupplyco.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-100-1001',
      company: 'Sign Supply Co.',
      location: { type: 'Point', coordinates: [-96.7970, 32.7767] }, // Dallas, TX
    },
    partner: {
      name: 'Sign Supply Co.',
      logo: 'SS',
      category: 'Materials & Supplies',
      description: 'Your one-stop shop for premium sign materials, vinyl, and installation supplies. Serving sign professionals with quality products since 2005.',
      specialties: ['Cast Vinyl', 'Calendered Vinyl', 'Application Tape', 'Sign Blanks'],
      benefits: ['Same-day shipping', 'Bulk discounts available', 'Technical support hotline', 'Custom cutting services'],
      discount: '20% off',
      rating: 4.7,
      reviewCount: 142,
      yearEstablished: 2005,
      locations: 12,
      isVerified: true,
      isFeatured: true,
      country: 'USA',
      contact: {
        contactPerson: 'Mike Thompson',
        phone: '555-100-1001',
        email: 'sales@signsupplyco.com',
        website: 'www.signsupplyco.com',
        address: '1234 Industrial Blvd, Dallas, TX 75001'
      }
    }
  },
  {
    user: {
      name: 'Sarah Martinez',
      email: 'sarah@printmasterpro.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-200-2002',
      company: 'PrintMaster Pro',
      location: { type: 'Point', coordinates: [-112.0740, 33.4484] }, // Phoenix, AZ
    },
    partner: {
      name: 'PrintMaster Pro',
      logo: 'PM',
      category: 'Equipment',
      description: 'Authorized dealer for top-tier wide-format printers and cutters. Expert installation, training, and ongoing support for your print shop.',
      specialties: ['Wide-Format Printers', 'Flatbed Printers', 'Laminating Equipment', 'Finishing Equipment'],
      benefits: ['Free on-site training', 'Extended warranty options', '24/7 support line', 'Trade-in programs'],
      discount: '0% Financing',
      rating: 4.9,
      reviewCount: 98,
      yearEstablished: 2010,
      locations: 8,
      isVerified: true,
      isFeatured: true,
      country: 'USA',
      contact: {
        contactPerson: 'Sarah Martinez',
        phone: '555-200-2002',
        email: 'sales@printmasterpro.com',
        website: 'www.printmasterpro.com',
        address: '5678 Tech Park Dr, Phoenix, AZ 85001'
      }
    }
  },
  {
    user: {
      name: 'James Wilson',
      email: 'james@channelletterking.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-300-3003',
      company: 'Channel Letter King',
      location: { type: 'Point', coordinates: [-84.3880, 33.7490] }, // Atlanta, GA
    },
    partner: {
      name: 'Channel Letter King',
      logo: 'CK',
      category: 'Services',
      description: 'Custom channel letter fabrication and LED modules. From design to delivery, we create stunning illuminated signage for any business.',
      specialties: ['Channel Letters', 'LED Modules', 'Neon Signs', 'Cabinet Signs'],
      benefits: ['Custom designs', 'Rush orders available', 'Nationwide shipping', 'Installation support'],
      discount: '15% off first order',
      rating: 4.6,
      reviewCount: 203,
      yearEstablished: 1998,
      locations: 3,
      isVerified: true,
      isFeatured: false,
      country: 'USA',
      contact: {
        contactPerson: 'James Wilson',
        phone: '555-300-3003',
        email: 'orders@channelletterking.com',
        website: 'www.channelletterking.com',
        address: '910 Manufacturing Way, Atlanta, GA 30301'
      }
    }
  },
  {
    user: {
      name: 'Emily Chen',
      email: 'emily@wrapworx.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-400-4004',
      company: 'WrapWorx',
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] }, // Los Angeles, CA
    },
    partner: {
      name: 'WrapWorx',
      logo: 'WW',
      category: 'Materials & Supplies',
      description: 'Specializing in premium vehicle wrap films and color change materials. Authorized distributor for major wrap brands.',
      specialties: ['Vehicle Wraps', 'Color Change Films', 'PPF Films', 'Ceramic Coatings'],
      benefits: ['Free color samples', 'Wrap training courses', 'Volume pricing', 'Technical consultations'],
      discount: '10-15% off',
      rating: 4.8,
      reviewCount: 167,
      yearEstablished: 2012,
      locations: 6,
      isVerified: true,
      isFeatured: true,
      country: 'Both',
      contact: {
        contactPerson: 'Emily Chen',
        phone: '555-400-4004',
        email: 'info@wrapworx.com',
        website: 'www.wrapworx.com',
        address: '2468 Auto Mall Dr, Los Angeles, CA 90001'
      }
    }
  },
  {
    user: {
      name: 'Robert Davis',
      email: 'robert@signfinance.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-500-5005',
      company: 'Sign Finance Solutions',
      location: { type: 'Point', coordinates: [-87.6298, 41.8781] }, // Chicago, IL
    },
    partner: {
      name: 'Sign Finance Solutions',
      logo: 'SF',
      category: 'Financing',
      description: 'Equipment financing and leasing options tailored for the sign industry. Quick approvals and competitive rates.',
      specialties: ['Equipment Leasing', 'Business Loans', 'Line of Credit', 'Working Capital'],
      benefits: ['Same-day approvals', 'Flexible terms', 'No prepayment penalties', 'Tax advantages'],
      discount: 'Special rates for members',
      rating: 4.5,
      reviewCount: 89,
      yearEstablished: 2008,
      locations: 1,
      isVerified: true,
      isFeatured: false,
      country: 'USA',
      contact: {
        contactPerson: 'Robert Davis',
        phone: '555-500-5005',
        email: 'loans@signfinance.com',
        website: 'www.signfinance.com',
        address: '1357 Finance Center, Chicago, IL 60601'
      }
    }
  },
  {
    user: {
      name: 'Lisa Brown',
      email: 'lisa@digitalsignpro.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-600-6006',
      company: 'Digital Sign Pro',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }, // San Francisco, CA
    },
    partner: {
      name: 'Digital Sign Pro',
      logo: 'DS',
      category: 'Software',
      description: 'Cloud-based sign shop management software. Streamline your workflow from quote to installation.',
      specialties: ['Shop Management', 'CRM Software', 'Production Tracking', 'Invoicing'],
      benefits: ['Free 30-day trial', 'Unlimited users', 'Mobile app included', 'Integration support'],
      discount: '25% off annual plans',
      rating: 4.4,
      reviewCount: 76,
      yearEstablished: 2015,
      locations: 1,
      isVerified: true,
      isFeatured: false,
      country: 'Both',
      contact: {
        contactPerson: 'Lisa Brown',
        phone: '555-600-6006',
        email: 'support@digitalsignpro.com',
        website: 'www.digitalsignpro.com',
        address: '789 Tech Way, San Francisco, CA 94102'
      }
    }
  },
  {
    user: {
      name: 'David Kim',
      email: 'david@ledlightsnow.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-700-7007',
      company: 'LED Lights Now',
      location: { type: 'Point', coordinates: [-95.3698, 29.7604] }, // Houston, TX
    },
    partner: {
      name: 'LED Lights Now',
      logo: 'LL',
      category: 'Equipment',
      description: 'Premium LED modules, power supplies, and lighting solutions for illuminated signage. UL Listed products.',
      specialties: ['LED Modules', 'Power Supplies', 'Channel Letter LEDs', 'Cabinet Lighting'],
      benefits: ['5-year warranty', 'Technical design help', 'Same-day shipping', 'Volume discounts'],
      discount: '18% off',
      rating: 4.7,
      reviewCount: 134,
      yearEstablished: 2007,
      locations: 4,
      isVerified: true,
      isFeatured: true,
      country: 'USA',
      contact: {
        contactPerson: 'David Kim',
        phone: '555-700-7007',
        email: 'orders@ledlightsnow.com',
        website: 'www.ledlightsnow.com',
        address: '3691 Light Industrial Pkwy, Houston, TX 77001'
      }
    }
  },
  {
    user: {
      name: 'Jennifer Taylor',
      email: 'jennifer@signinsurance.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-800-8008',
      company: 'Sign Industry Insurance',
      location: { type: 'Point', coordinates: [-104.9903, 39.7392] }, // Denver, CO
    },
    partner: {
      name: 'Sign Industry Insurance',
      logo: 'SI',
      category: 'Insurance',
      description: 'Specialized insurance coverage for sign companies. General liability, workers comp, and equipment coverage.',
      specialties: ['General Liability', 'Workers Compensation', 'Equipment Insurance', 'Vehicle Coverage'],
      benefits: ['Industry-specific policies', 'Competitive rates', 'Claims support', 'Risk management'],
      discount: '10% member discount',
      rating: 4.3,
      reviewCount: 54,
      yearEstablished: 1995,
      locations: 1,
      isVerified: true,
      isFeatured: false,
      country: 'USA',
      contact: {
        contactPerson: 'Jennifer Taylor',
        phone: '555-800-8008',
        email: 'quotes@signinsurance.com',
        website: 'www.signinsurance.com',
        address: '4820 Insurance Plaza, Denver, CO 80201'
      }
    }
  }
];

async function seedVendorPartners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let createdCount = 0;
    let skippedCount = 0;

    for (const item of vendorPartners) {
      // Check if user already exists
      let vendor = await User.findOne({ email: item.user.email });

      if (!vendor) {
        // Create vendor user
        vendor = await User.create(item.user);
        console.log(`Created vendor user: ${item.user.email}`);
      } else {
        console.log(`Vendor user already exists: ${item.user.email}`);
      }

      // Check if partner already exists for this vendor
      const existingPartner = await Partner.findOne({ vendorId: vendor._id });

      if (!existingPartner) {
        // Create partner with vendorId
        await Partner.create({
          ...item.partner,
          vendorId: vendor._id
        });
        console.log(`Created partner: ${item.partner.name}`);
        createdCount++;
      } else {
        console.log(`Partner already exists for vendor: ${item.partner.name}`);
        skippedCount++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Created ${createdCount} new vendor partners`);
    console.log(`Skipped ${skippedCount} existing partners`);
    console.log('\nVendor login credentials (all use password: vendor123):');
    vendorPartners.forEach(item => {
      console.log(`  - ${item.user.email}`);
    });

    await mongoose.connection.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error seeding vendor partners:', error);
    process.exit(1);
  }
}

seedVendorPartners();
