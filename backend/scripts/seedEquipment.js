const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Equipment = require('../models/Equipment');

const equipmentData = [
  {
    name: 'Roland TrueVIS VG3-640 Printer/Cutter',
    category: 'large-format-printers',
    brand: 'Roland',
    model: 'VG3-640',
    price: '$19,995',
    priceNote: 'Starting at',
    image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800',
    description: '64" wide-format printer/cutter with True Rich Color technology and FlexFire LED curing. Perfect for vehicle wraps, banners, and signage.',
    features: [
      'True Rich Color 2 Ink Set',
      'FlexFire LED Curing',
      '64" Maximum Media Width',
      'Integrated Cutting',
      '7-Year Printhead Warranty'
    ],
    specifications: {
      'Print Width': '64 inches',
      'Max Resolution': '1200 dpi',
      'Ink Type': 'TrueVIS INK',
      'Ink Colors': '8 Colors (CMYK + Lc, Lm, Lk, Or)',
      'Cutting Force': '600 grams'
    },
    availability: 'in-stock',
    rating: 4.9,
    reviews: 127,
    warranty: '3 Years',
    isFeatured: true,
    isNewArrival: true,
    leadTime: 'Ships in 2-3 weeks',
    sortOrder: 1
  },
  {
    name: 'Graphtec FC9000-160 Vinyl Cutter',
    category: 'vinyl-cutters',
    brand: 'Graphtec',
    model: 'FC9000-160',
    price: '$7,495',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    description: '64" professional vinyl cutter with ARMS 8.0 and incredible cutting accuracy for the most detailed work.',
    features: [
      'ARMS 8.0 Registration',
      '600mm/s Max Speed',
      '64" Cutting Width',
      'Continuous Crop Marks',
      'OptiCut ARMS Technology'
    ],
    specifications: {
      'Cutting Width': '64 inches',
      'Max Speed': '600 mm/s',
      'Cutting Force': '600 grams',
      'Precision': '±0.1mm'
    },
    availability: 'in-stock',
    rating: 4.8,
    reviews: 89,
    warranty: '2 Years',
    isFeatured: true,
    isNewArrival: false,
    leadTime: 'Ships in 1-2 weeks',
    sortOrder: 2
  },
  {
    name: 'ShopSabre PRO4848 CNC Router',
    category: 'cnc-routers',
    brand: 'ShopSabre',
    model: 'PRO4848',
    price: '$24,500',
    priceNote: 'Plus installation',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    description: '4x4 professional CNC router perfect for dimensional signage, channel letters, and precision cutting.',
    features: [
      '4x4 Cutting Area',
      '5HP Spindle',
      'Ball Screw Drives',
      'Vacuum Table',
      'Automatic Tool Changer'
    ],
    specifications: {
      'Cutting Area': '48" x 48"',
      'Z-Axis Travel': '10 inches',
      'Spindle Power': '5 HP',
      'Positioning Speed': '1200 IPM'
    },
    availability: 'in-stock',
    rating: 4.7,
    reviews: 45,
    warranty: '5 Years',
    isFeatured: true,
    isNewArrival: false,
    leadTime: 'Ships in 3-4 weeks',
    sortOrder: 3
  },
  {
    name: 'AccuBend 410 Channel Letter Bender',
    category: 'channel-letter',
    brand: 'AccuBend',
    model: '410',
    price: '$12,800',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
    description: 'Automatic channel letter bending machine for aluminum and stainless steel coil up to 4" tall.',
    features: [
      'Automatic Bending',
      '4" Max Letter Height',
      'Touch Screen Control',
      'Multiple Material Support',
      'Letter File Import'
    ],
    specifications: {
      'Max Height': '4 inches',
      'Min Radius': '0.25 inches',
      'Material': 'Aluminum/Stainless',
      'Coil Width': '0.040"'
    },
    availability: 'in-stock',
    rating: 4.6,
    reviews: 32,
    warranty: '2 Years',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships in 2-3 weeks',
    sortOrder: 4
  },
  {
    name: 'Miller Millermatic 252 MIG Welder',
    category: 'welding',
    brand: 'Miller',
    model: 'Millermatic 252',
    price: '$3,495',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    description: 'Professional MIG welder ideal for sign fabrication with aluminum and steel capability.',
    features: [
      'Auto-Set Elite',
      '200A at 28V',
      'Spool Gun Ready',
      'Digital Meters',
      'Fan-On-Demand'
    ],
    specifications: {
      'Amperage Range': '30-200A',
      'Wire Speed': '50-700 IPM',
      'Input Power': '208/230V',
      'Duty Cycle': '40% at 200A'
    },
    availability: 'in-stock',
    rating: 4.9,
    reviews: 156,
    warranty: '3 Years',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships in 1-2 weeks',
    sortOrder: 5
  },
  {
    name: 'Elliott G85 Bucket Truck',
    category: 'vehicles',
    brand: 'Elliott',
    model: 'G85',
    price: '$125,000',
    priceNote: 'Call for quote',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    description: '85ft working height aerial platform for high-rise sign installation and maintenance.',
    features: [
      '85ft Working Height',
      '750 lb Platform Capacity',
      '135° Articulation',
      'Side Reach 55ft',
      'CDL Required'
    ],
    specifications: {
      'Working Height': '85 feet',
      'Platform Capacity': '750 lbs',
      'Side Reach': '55 feet',
      'Stowed Height': '12\' 6"'
    },
    availability: 'pre-order',
    rating: 4.8,
    reviews: 23,
    warranty: '1 Year',
    isFeatured: false,
    isNewArrival: false,
    leadTime: '8-12 weeks',
    sortOrder: 6
  },
  {
    name: 'Stahls Hotronix Fusion IQ Heat Press',
    category: 'heat-transfer',
    brand: 'Stahls',
    model: 'Fusion IQ',
    price: '$1,895',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    description: '16x20 digital heat press with smart features for heat transfer vinyl and sublimation.',
    features: [
      'Smart Heat Technology',
      'Touch Screen Display',
      'Auto-Open Feature',
      'Interchangeable Platens',
      'USB Connectivity'
    ],
    specifications: {
      'Platen Size': '16" x 20"',
      'Temp Range': '0-450°F',
      'Time Range': '0-999 seconds',
      'Max Pressure': '80 PSI'
    },
    availability: 'in-stock',
    rating: 4.7,
    reviews: 234,
    warranty: '2 Years',
    isFeatured: false,
    isNewArrival: true,
    leadTime: 'Ships in 3-5 days',
    sortOrder: 7
  },
  {
    name: 'GBC Titan 1264WF Laminator',
    category: 'laminators',
    brand: 'GBC',
    model: 'Titan 1264WF',
    price: '$8,995',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    description: '64" wide format laminator with front rewinder for high-volume print finishing.',
    features: [
      '64" Max Width',
      'Hot/Cold Capability',
      'Front Rewinder',
      'Variable Speed',
      'Digital Controls'
    ],
    specifications: {
      'Max Width': '64 inches',
      'Speed': '30 fpm',
      'Temperature': '180-330°F',
      'Roller Type': 'Silicone'
    },
    availability: 'in-stock',
    rating: 4.5,
    reviews: 67,
    warranty: '2 Years',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships in 1-2 weeks',
    sortOrder: 8
  },
  {
    name: 'SloanLED VL4 LED Module System',
    category: 'led-lighting',
    brand: 'SloanLED',
    model: 'VL4',
    price: '$4.50',
    priceNote: 'Per module',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    description: 'Premium LED modules for channel letter and cabinet sign illumination.',
    features: [
      '7-Year Warranty',
      'UL Listed',
      'Wide Viewing Angle',
      'High Output',
      'Easy Installation'
    ],
    specifications: {
      'Lumens': '65 lm/module',
      'Wattage': '0.72W',
      'Voltage': '12V DC',
      'Life': '50,000 hours'
    },
    availability: 'in-stock',
    rating: 4.9,
    reviews: 312,
    warranty: '7 Years',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships same day',
    sortOrder: 9
  },
  {
    name: 'Samsung OM55N-D Outdoor Display',
    category: 'digital-displays',
    brand: 'Samsung',
    model: 'OM55N-D',
    price: '$4,999',
    image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800',
    description: '55" outdoor digital signage display rated for full sunlight readability.',
    features: [
      '3000 nits Brightness',
      'IP56 Rated',
      '24/7 Operation',
      'Built-in Media Player',
      'Tempered Glass'
    ],
    specifications: {
      'Screen Size': '55 inches',
      'Resolution': '4K UHD',
      'Brightness': '3000 nits',
      'Operating Temp': '-22°F to 122°F'
    },
    availability: 'in-stock',
    rating: 4.6,
    reviews: 78,
    warranty: '3 Years',
    isFeatured: false,
    isNewArrival: true,
    leadTime: 'Ships in 1-2 weeks',
    sortOrder: 10
  },
  {
    name: 'SignTools Pro Installation Kit',
    category: 'hand-tools',
    brand: 'SignTools',
    model: 'Pro Kit',
    price: '$299',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
    description: 'Complete professional installation toolkit for vehicle wraps and wall graphics.',
    features: [
      '45 Piece Set',
      'Carrying Case',
      'Squeegees & Felts',
      'Cutting Tools',
      'Measuring Tools'
    ],
    specifications: {
      'Pieces': '45',
      'Case Material': 'Hard Shell',
      'Weight': '8 lbs',
      'Warranty': 'Lifetime'
    },
    availability: 'in-stock',
    rating: 4.8,
    reviews: 445,
    warranty: 'Lifetime',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships same day',
    sortOrder: 11
  },
  {
    name: '3M Fall Protection Harness Kit',
    category: 'safety-equipment',
    brand: '3M',
    model: 'DBI-SALA',
    price: '$449',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
    description: 'OSHA-compliant fall protection harness kit for sign installation at height.',
    features: [
      'OSHA Compliant',
      'Full Body Harness',
      '50ft Lifeline',
      'Shock Absorber',
      'Roof Anchor'
    ],
    specifications: {
      'Capacity': '420 lbs',
      'Lanyard Length': '6 feet',
      'Lifeline': '50 feet',
      'Certification': 'ANSI Z359.1'
    },
    availability: 'in-stock',
    rating: 4.9,
    reviews: 167,
    warranty: '1 Year',
    isFeatured: false,
    isNewArrival: false,
    leadTime: 'Ships same day',
    sortOrder: 12
  }
];

const seedEquipment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing equipment
    await Equipment.deleteMany({});
    console.log('Cleared existing equipment');

    // Create equipment
    for (const item of equipmentData) {
      const equipment = await Equipment.create(item);
      console.log(`Created: ${equipment.name}`);
    }

    console.log(`\n✅ Successfully seeded ${equipmentData.length} equipment items!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding equipment:', error);
    process.exit(1);
  }
};

seedEquipment();
