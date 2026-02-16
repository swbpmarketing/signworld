const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Partner = require('../models/Partner');

// Map specialty/bio text to a Partner category enum value
function mapCategory(text) {
  const lower = (text || '').toLowerCase();
  if (/printer|press|cnc|laser|rout|cutter|machine|engraving|flatbed|dtf|dtg|sublimation/.test(lower)) return 'Equipment';
  if (/vinyl|media|ink|material|suppli|film|tape|substrate|graphic|lamina/.test(lower)) return 'Materials & Supplies';
  if (/wholesale|channel letter|sign cabin|distributor|dimensional|letter|carved|sandblast|post.*panel|architectural sign|frame|plaque|lobby/.test(lower)) return 'Distributor';
  if (/install|service|staffing|recruit|hiring|marketing|coach|portal|payroll|promotion|consult|hr\b|job|insurance|wrap tool/.test(lower)) return 'Services';
  if (/software/.test(lower)) return 'Software';
  if (/financ|loan|credit/.test(lower)) return 'Financing';
  if (/insurance/.test(lower)) return 'Insurance';
  return 'Other';
}

async function createPartnerProfiles() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Get all vendor users
  const vendors = await User.find({ role: 'vendor' });
  console.log(`Found ${vendors.length} vendor accounts`);

  // Delete any existing partner profiles (clean slate)
  const deleted = await Partner.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing partner profiles`);

  let created = 0;
  let failed = 0;

  for (const vendor of vendors) {
    try {
      // Build description from bio, specialties, or equipment
      const description = vendor.bio
        || (vendor.specialties && vendor.specialties.length > 0 ? vendor.specialties.join(', ') : '')
        || (vendor.equipment && vendor.equipment.length > 0 ? vendor.equipment.join(', ') : '')
        || '';

      // Determine category from specialties/bio
      const categorySource = [
        ...(vendor.specialties || []),
        ...(vendor.equipment || []),
        vendor.bio || '',
      ].join(' ');
      const category = mapCategory(categorySource);

      // Build address string
      const addressParts = [
        vendor.address?.street,
        vendor.address?.city,
        vendor.address?.state,
        vendor.address?.zipCode,
      ].filter(Boolean);
      const addressStr = addressParts.join(', ');

      const partner = await Partner.create({
        vendorId: vendor._id,
        name: vendor.company || vendor.name,
        description,
        category,
        country: vendor.address?.country || 'USA',
        contact: {
          contactPerson: vendor.name,
          email: vendor.email,
          phone: vendor.phone || undefined,
          website: vendor.socialLinks?.website || undefined,
          address: addressStr || undefined,
        },
        specialties: vendor.specialties || [],
        roles: ['vendor'],
        isActive: true,
        isVerified: vendor.emailVerified || false,
        isFeatured: false,
        sortOrder: 0,
        locations: 1,
        discount: '',
      });

      created++;
    } catch (err) {
      failed++;
      console.log(`  Failed for ${vendor.email}: ${err.message}`);
    }
  }

  console.log(`\nCreated ${created} partner profiles`);
  if (failed > 0) console.log(`Failed: ${failed}`);

  const total = await Partner.countDocuments({});
  console.log(`Total partner profiles in DB: ${total}`);

  // Sample
  const samples = await Partner.find({}).sort({ name: 1 }).limit(5);
  for (const p of samples) {
    console.log(`  - ${p.name} [${p.category}] vendor-linked: ${!!p.vendorId}`);
  }

  await mongoose.connection.close();
  console.log('Done!');
}

createPartnerProfiles().catch(err => {
  console.error('Failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
