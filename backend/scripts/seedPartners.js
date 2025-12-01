const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Partner = require('../models/Partner');

const partners = [
  {
    name: '3M Commercial Graphics',
    logo: '3M',
    category: 'Materials & Supplies',
    description: 'Industry-leading vinyl films, overlaminates, and adhesives for vehicle wraps and signage.',
    specialties: ['Vinyl Films', 'Overlaminates', 'Reflective Materials', 'Window Films'],
    benefits: ['Exclusive Sign Company pricing', 'Free technical support', 'Same-day shipping on most orders', 'Extended warranty programs'],
    discount: '15-25% off',
    rating: 4.9,
    reviewCount: 234,
    yearEstablished: 1902,
    locations: 200,
    isVerified: true,
    isFeatured: true,
    country: 'USA',
    contact: { contactPerson: 'John Smith - Partner Relations', phone: '1-800-328-3908', email: 'partners@3m.com', website: 'www.3m.com/graphics' }
  },
  {
    name: 'Roland DGA',
    logo: 'RD',
    category: 'Equipment',
    description: 'Premium wide-format printers, cutters, and engravers for professional sign making.',
    specialties: ['Wide-Format Printers', 'Vinyl Cutters', 'UV Printers', 'Engravers'],
    benefits: ['0% financing for 48 months', 'Free installation and training', 'Lifetime technical support', 'Trade-in programs available'],
    discount: 'Special Financing',
    rating: 4.8,
    reviewCount: 189,
    yearEstablished: 1981,
    locations: 50,
    isVerified: true,
    isFeatured: true,
    country: 'USA',
    contact: { contactPerson: 'Maria Garcia - Account Manager', phone: '1-800-542-2307', email: 'signworld@rolanddga.com', website: 'www.rolanddga.com' }
  },
  {
    name: 'Grimco',
    logo: 'GR',
    category: 'Distributor',
    description: 'One-stop shop for sign supplies, equipment, and digital media with nationwide distribution.',
    specialties: ['Sign Supplies', 'Digital Media', 'Equipment', 'Installation Tools'],
    benefits: ['Next-day delivery available', 'Online ordering portal', 'Dedicated account manager', 'Volume discounts'],
    discount: '10-20% off',
    rating: 4.7,
    reviewCount: 156,
    yearEstablished: 1875,
    locations: 60,
    isVerified: true,
    isFeatured: false,
    country: 'USA',
    contact: { contactPerson: 'David Lee - Partner Specialist', phone: '1-800-542-9941', email: 'signworld@grimco.com', website: 'www.grimco.com' }
  },
  {
    name: 'Avery Dennison',
    logo: 'AD',
    category: 'Materials & Supplies',
    description: 'High-performance vinyl films and wrapping solutions for vehicles and architectural applications.',
    specialties: ['Vehicle Wraps', 'Architectural Films', 'Color Change Wraps', 'Protection Films'],
    benefits: ['Warranty support program', 'Free sample kits', 'Online training academy', 'Marketing co-op funds'],
    discount: '20% off',
    rating: 4.8,
    reviewCount: 201,
    yearEstablished: 1935,
    locations: 180,
    isVerified: true,
    isFeatured: false,
    country: 'USA',
    contact: { contactPerson: 'Susan Park - Regional Manager', phone: '1-800-282-8379', email: 'graphics@averydennison.com', website: 'www.averydennison.com' }
  },
  {
    name: 'SignWarehouse',
    logo: 'SW',
    category: 'Distributor',
    description: 'Complete sign supply distributor offering vinyl, equipment, and accessories at competitive prices.',
    specialties: ['Vinyl', 'Sign Blanks', 'LED Modules', 'Software'],
    benefits: ['Free shipping over $100', 'Low price guarantee', 'Bulk discounts', 'Technical support'],
    discount: '15% off',
    rating: 4.5,
    reviewCount: 89,
    yearEstablished: 1990,
    locations: 5,
    isVerified: true,
    isFeatured: false,
    country: 'USA',
    contact: { contactPerson: 'Mike Johnson', phone: '1-800-328-1955', email: 'sales@signwarehouse.com', website: 'www.signwarehouse.com' }
  },
  {
    name: 'HP Large Format',
    logo: 'HP',
    category: 'Equipment',
    description: 'Industry-leading large format printers and inks for high-quality signage production.',
    specialties: ['Large Format Printers', 'Latex Inks', 'Print Management', 'Color Management'],
    benefits: ['Trade-in rebates', 'Extended service plans', 'HP Supplies program', 'Training workshops'],
    discount: 'Up to $5000 rebate',
    rating: 4.6,
    reviewCount: 145,
    yearEstablished: 1939,
    locations: 300,
    isVerified: true,
    isFeatured: true,
    country: 'Both',
    contact: { contactPerson: 'HP Graphics Team', phone: '1-800-474-6836', email: 'graphics@hp.com', website: 'www.hp.com/go/graphicarts' }
  },
  {
    name: 'ORAFOL Americas',
    logo: 'OR',
    category: 'Materials & Supplies',
    description: 'Premium reflective and graphic films for traffic signs, vehicle graphics, and commercial applications.',
    specialties: ['Reflective Films', 'Graphic Films', 'Traffic Signs', 'Fleet Graphics'],
    benefits: ['Technical support hotline', 'Training seminars', 'Color matching service', 'Sample program'],
    discount: '12% off',
    rating: 4.7,
    reviewCount: 112,
    yearEstablished: 1950,
    locations: 45,
    isVerified: true,
    isFeatured: false,
    country: 'USA',
    contact: { contactPerson: 'Tom Richards', phone: '1-800-341-2022', email: 'graphics@orafol.com', website: 'www.orafolamericas.com' }
  },
  {
    name: 'Flexi Software',
    logo: 'FL',
    category: 'Software',
    description: 'Professional sign-making software suite for design, production, and RIP solutions.',
    specialties: ['Design Software', 'RIP Software', 'Print & Cut', 'Production Management'],
    benefits: ['Free updates for 1 year', 'Online training videos', 'Priority tech support', 'Cloud storage'],
    discount: '25% off subscription',
    rating: 4.4,
    reviewCount: 78,
    yearEstablished: 1992,
    locations: 1,
    isVerified: true,
    isFeatured: false,
    country: 'Both',
    contact: { contactPerson: 'Flexi Support', phone: '1-800-328-2753', email: 'sales@saicloud.com', website: 'www.saicloud.com' }
  }
];

async function seedPartners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing partners
    await Partner.deleteMany({});
    console.log('Cleared existing partners');

    // Insert new partners
    const result = await Partner.insertMany(partners);
    console.log('Seeded ' + result.length + ' partners successfully');

    mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding partners:', error);
    process.exit(1);
  }
}

seedPartners();
