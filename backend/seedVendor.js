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
const Partner = require('./models/Partner');

const seedVendor = async () => {
  try {
    // Check if vendor already exists
    const vendorExists = await User.findOne({ email: 'vendor@example.com' });

    if (vendorExists) {
      console.log('Vendor user already exists!');

      // Check if partner profile exists
      const partnerExists = await Partner.findOne({ vendorId: vendorExists._id });

      if (!partnerExists) {
        console.log('Creating partner profile for existing vendor...');
        await Partner.create({
          vendorId: vendorExists._id,
          name: 'Acme Sign Materials',
          description: 'Leading provider of high-quality sign materials, vinyl, and substrates. Serving the sign industry for over 20 years with premium products and exceptional customer service.',
          logo: 'https://via.placeholder.com/200x200?text=Acme+Materials',
          category: 'materials',
          country: 'USA',
          contact: {
            name: 'John Vendor',
            email: 'vendor@example.com',
            phone: '555-123-4567',
            website: 'https://acmematerials.example.com',
          },
          services: [
            'Vinyl Graphics',
            'Substrates & Boards',
            'Digital Printing Materials',
            'Installation Supplies',
            'Custom Fabrication'
          ],
          specialOffers: [
            {
              title: '15% Off First Order',
              description: 'New customers receive 15% off their first order of $500 or more',
              validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
              code: 'FIRST15'
            },
            {
              title: 'Free Shipping on Orders Over $1000',
              description: 'Get free shipping on all orders over $1000',
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              code: 'FREESHIP1K'
            }
          ],
          documents: [
            {
              title: 'Product Catalog 2024',
              fileUrl: 'https://example.com/catalog-2024.pdf',
              fileType: 'pdf'
            },
            {
              title: 'Material Specifications',
              fileUrl: 'https://example.com/specs.pdf',
              fileType: 'pdf'
            },
            {
              title: 'Installation Guide',
              fileUrl: 'https://example.com/installation-guide.pdf',
              fileType: 'pdf'
            }
          ],
          isActive: true,
          isFeatured: true,
          sortOrder: 1
        });
        console.log('Partner profile created successfully!');
      } else {
        console.log('Partner profile already exists!');
      }

      process.exit(0);
    }

    // Create vendor user (password will be hashed by User model pre-save hook)
    const vendor = await User.create({
      name: 'John Vendor',
      email: 'vendor@example.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '555-123-4567',
      company: 'Acme Sign Materials',
      address: {
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
      },
    });

    console.log('Vendor user created successfully!');
    console.log('Email: vendor@example.com');
    console.log('Password: vendor123');

    // Create partner profile for this vendor
    await Partner.create({
      vendorId: vendor._id,
      name: 'Acme Sign Materials',
      description: 'Leading provider of high-quality sign materials, vinyl, and substrates. Serving the sign industry for over 20 years with premium products and exceptional customer service.',
      logo: 'https://via.placeholder.com/200x200?text=Acme+Materials',
      category: 'materials',
      country: 'USA',
      contact: {
        name: 'John Vendor',
        email: 'vendor@example.com',
        phone: '555-123-4567',
        website: 'https://acmematerials.example.com',
      },
      services: [
        'Vinyl Graphics',
        'Substrates & Boards',
        'Digital Printing Materials',
        'Installation Supplies',
        'Custom Fabrication'
      ],
      specialOffers: [
        {
          title: '15% Off First Order',
          description: 'New customers receive 15% off their first order of $500 or more',
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          code: 'FIRST15'
        },
        {
          title: 'Free Shipping on Orders Over $1000',
          description: 'Get free shipping on all orders over $1000',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          code: 'FREESHIP1K'
        }
      ],
      documents: [
        {
          title: 'Product Catalog 2024',
          fileUrl: 'https://example.com/catalog-2024.pdf',
          fileType: 'pdf'
        },
        {
          title: 'Material Specifications',
          fileUrl: 'https://example.com/specs.pdf',
          fileType: 'pdf'
        },
        {
          title: 'Installation Guide',
          fileUrl: 'https://example.com/installation-guide.pdf',
          fileType: 'pdf'
        }
      ],
      isActive: true,
      isFeatured: true,
      sortOrder: 1
    });

    console.log('Partner profile created successfully!');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding vendor:', error);
    process.exit(1);
  }
};

seedVendor();
