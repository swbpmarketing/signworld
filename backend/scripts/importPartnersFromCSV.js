const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Partner = require('../models/Partner');

// Parse WordPress serialized PHP capabilities to extract role names
function parseRoles(wpCapabilities) {
  if (!wpCapabilities) return [];
  const roles = [];
  // Match patterns like s:10:"subscriber";b:1
  const regex = /s:\d+:"([^"]+)";b:1/g;
  let match;
  while ((match = regex.exec(wpCapabilities)) !== null) {
    roles.push(match[1]);
  }
  return roles;
}

// Map specialty text to a Partner category enum value
function mapCategory(stype, equipment, specialities) {
  const text = `${stype} ${equipment} ${specialities}`.toLowerCase();
  if (/printer|press|cnc|laser|rout|cutter|machine|engraving|flatbed/.test(text)) return 'Equipment';
  if (/vinyl|media|ink|material|suppli|film|tape|substrate|graphic|lamina/.test(text)) return 'Materials & Supplies';
  if (/wholesale|channel letter|sign cabin|distributor|dimensional|letter|carved|sandblast|post.*panel|architectural sign|frame/.test(text)) return 'Distributor';
  if (/install|service|staffing|recruit|hiring|marketing|coach|portal|payroll|promotion|consult|hr\b|job/.test(text)) return 'Services';
  if (/software/.test(text)) return 'Software';
  if (/financ|loan|credit/.test(text)) return 'Financing';
  if (/insurance/.test(text)) return 'Insurance';
  return 'Other';
}

async function importPartners() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Read and parse CSV
  const csvPath = path.join(__dirname, '..', '..', 'partners data', 'signworldowners.users.2026-02-16-05-43-44.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  console.log(`Parsed ${records.length} CSV records`);

  // Delete all existing partners
  const deleted = await Partner.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing partners`);

  const partners = [];
  let skipped = 0;

  for (const record of records) {
    const company = (record.company || record.display_name || record.nickname || '').trim();
    if (!company) {
      skipped++;
      continue;
    }

    const equipment = (record.equipment || '').trim();
    const specialities = (record.specialities || '').trim();
    const stype = (record.stype || '').trim();

    // Build description from available fields
    const description = equipment || specialities || stype || '';

    // Extract roles from wp_capabilities
    const roles = parseRoles(record.wp_capabilities);

    // Map to a category
    const category = mapCategory(stype, equipment, specialities);

    // Determine country
    let country = 'USA';
    if (record.country) {
      const c = record.country.toLowerCase().trim();
      if (c === 'canada' || c === 'ca') country = 'Canada';
      else if (c.includes('both')) country = 'Both';
    }

    // Build address string
    const addressParts = [record.address, record.city, record.state, record.zip].filter(p => p && p.trim());
    const address = addressParts.join(', ');

    // Build specialties array
    let specialtiesArr = [];
    if (specialities) {
      specialtiesArr = specialities.split(',').map(s => s.trim()).filter(Boolean);
    } else if (stype) {
      specialtiesArr = stype.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Contact person
    const contactPerson = `${(record.first_name || '').trim()} ${(record.last_name || '').trim()}`.trim();

    // Email - prefer semail (secondary email), fallback to user_email
    // Some fields have multiple emails separated by ; — take the first valid one
    let email = (record.semail || record.user_email || '').trim();
    if (email.includes(';')) {
      email = email.split(';')[0].trim();
    }
    // Validate email format, clear if invalid
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (email && !emailRegex.test(email)) {
      email = '';
    }

    // Phone
    const phone = (record.phone || record.telephone || record.pphone || '').trim();

    // Website
    const website = (record.website || record.user_url || '').trim();

    // Check if verified (pw_user_status === 'approved')
    const isVerified = record.pw_user_status === 'approved';

    partners.push({
      name: company,
      description,
      category,
      country,
      contact: {
        contactPerson: contactPerson || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address || undefined,
      },
      specialties: specialtiesArr,
      roles,
      isActive: true,
      isVerified,
      isFeatured: false,
      sortOrder: 0,
      locations: 1,
      discount: '',
    });
  }

  // Insert all partners
  const result = await Partner.insertMany(partners);
  console.log(`Imported ${result.length} partners (skipped ${skipped} empty records)`);

  // Show a sample
  const sample = result.slice(0, 3);
  for (const p of sample) {
    console.log(`  - ${p.name} [${p.category}] roles: ${p.roles.join(', ')}`);
  }

  await mongoose.connection.close();
  console.log('Done!');
}

importPartners().catch(err => {
  console.error('Import failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
