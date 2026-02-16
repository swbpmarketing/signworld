const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse/sync');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Partner = require('../models/Partner');

// Parse WordPress serialized PHP capabilities to extract role names
function parseWpRoles(wpCapabilities) {
  if (!wpCapabilities) return [];
  const roles = [];
  const regex = /s:\d+:"([^"]+)";b:1/g;
  let match;
  while ((match = regex.exec(wpCapabilities)) !== null) {
    roles.push(match[1]);
  }
  return roles;
}

// Clean phone number - strip non-numeric except + - ( ) and spaces
// Return empty string if it doesn't look like a phone number
function cleanPhone(raw) {
  if (!raw) return '';
  // Remove known non-phone text (names, titles)
  let cleaned = raw.trim();
  // If it contains letters (like a name), it's not a phone number
  if (/[a-zA-Z]/.test(cleaned)) return '';
  // Strip everything except digits, +, -, (, ), spaces, dots
  cleaned = cleaned.replace(/[^\d\+\-\(\)\s\.]/g, '');
  // Must have at least 7 digits to be a phone number
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount < 7) return '';
  return cleaned;
}

async function importVendors() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Step 1: Delete the wrongly-imported Partner records
  const deletedPartners = await Partner.deleteMany({});
  console.log(`Cleaned up ${deletedPartners.deletedCount} wrong partner records`);

  // Step 2: Read and parse CSV
  const csvPath = path.join(__dirname, '..', '..', 'partners data', 'signworldowners.users.2026-02-16-05-43-44.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  console.log(`Parsed ${records.length} CSV records`);

  // Step 3: Delete existing vendor users (so we can re-import cleanly)
  const deletedVendors = await User.deleteMany({ role: 'vendor' });
  console.log(`Deleted ${deletedVendors.deletedCount} existing vendor accounts`);

  // Pre-hash a default password for all vendors
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('SignworldVendor2024!', salt);

  const vendors = [];
  const seenEmails = new Set();
  let skipped = 0;
  const skipReasons = [];

  for (const record of records) {
    // Get email - required and must be unique
    let email = (record.user_email || '').trim().toLowerCase();
    if (email.includes(';')) {
      email = email.split(';')[0].trim();
    }

    const emailRegex = /^\w+([\.\-\+]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
      skipped++;
      skipReasons.push(`Invalid email: "${email}" (${record.display_name || record.company || 'unknown'})`);
      continue;
    }

    if (seenEmails.has(email)) {
      skipped++;
      skipReasons.push(`Duplicate email: "${email}" (${record.display_name || record.company || 'unknown'})`);
      continue;
    }
    seenEmails.add(email);

    // Check if this email already exists in the database (could be admin/owner)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      skipped++;
      skipReasons.push(`Email already in DB: "${email}" as ${existingUser.role} (${record.display_name || record.company || 'unknown'})`);
      continue;
    }

    // Name
    const firstName = (record.first_name || '').trim();
    const lastName = (record.last_name || '').trim();
    const name = `${firstName} ${lastName}`.trim() || (record.display_name || '').trim() || (record.company || '').trim() || 'Vendor';

    // Company
    const company = (record.company || record.display_name || '').trim();

    // Phone - clean and validate
    const phone = cleanPhone(record.phone || record.telephone || record.pphone || '');

    // Address
    const street = (record.address || '').trim();
    const city = (record.city || '').trim();
    const state = (record.state || '').trim();
    const zipCode = (record.zip || '').trim();
    let country = 'USA';
    if (record.country) {
      const c = record.country.toLowerCase().trim();
      if (c === 'canada' || c === 'ca') country = 'Canada';
    }

    // Location (GeoJSON)
    const lat = parseFloat(record.latitude);
    const lng = parseFloat(record.longitude);
    const location = (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0)
      ? { type: 'Point', coordinates: [lng, lat] }
      : undefined;

    // Specialties from specialities or stype columns
    const specialities = (record.specialities || '').trim();
    const stype = (record.stype || '').trim();
    let specialties = [];
    if (specialities) {
      specialties = specialities.split(',').map(s => s.trim()).filter(Boolean);
    } else if (stype) {
      specialties = stype.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Equipment
    const equipmentText = (record.equipment || '').trim();
    const equipment = equipmentText
      ? equipmentText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Bio - use the longer description or equipment text
    const bio = equipmentText || specialities || stype || '';

    // Social links
    const socialLinks = {};
    if (record.facebook) socialLinks.facebook = record.facebook.trim();
    if (record.linkedin) socialLinks.linkedin = record.linkedin.trim();
    if (record.instagram) socialLinks.instagram = record.instagram.trim();
    const website = (record.website || record.user_url || '').trim();
    if (website) socialLinks.website = website;

    // Mentoring
    const isMentor = (record.is_mentor || '').toLowerCase() === 'yes';

    // Awards
    const awards = parseInt(record.awards) || 0;

    // WordPress roles (for reference)
    const wpRoles = parseWpRoles(record.wp_capabilities);

    vendors.push({
      name,
      email,
      password: defaultPasswordHash,
      role: 'vendor',
      emailVerified: true, // They're existing users from WordPress
      company: company || undefined,
      phone: phone || undefined,
      address: {
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country,
      },
      location,
      specialties,
      equipment,
      bio: bio || undefined,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      mentoring: {
        available: isMentor,
        areas: [],
      },
      awards,
      isActive: true,
    });
  }

  // Insert all vendors (bypass the pre-save hook since password is already hashed)
  // We need to use insertMany with { rawResult: false } to skip hooks
  console.log(`\nPrepared ${vendors.length} vendor accounts to import...`);

  // Insert in batches to handle any validation errors gracefully
  let imported = 0;
  let failed = 0;
  for (const vendor of vendors) {
    try {
      // Use create() but we need to avoid double-hashing the password
      // Since pre-save hook hashes on isModified('password'), and insertMany
      // doesn't trigger hooks, we use insertMany for individual docs
      await User.collection.insertOne(vendor);
      imported++;
    } catch (err) {
      failed++;
      skipReasons.push(`Insert failed for "${vendor.email}": ${err.message}`);
    }
  }

  console.log(`\nImported ${imported} vendor accounts`);
  if (failed > 0) console.log(`Failed: ${failed}`);
  if (skipped > 0) {
    console.log(`\nSkipped ${skipped} records:`);
    skipReasons.forEach(r => console.log(`  - ${r}`));
  }

  // Show sample
  const sampleVendors = await User.find({ role: 'vendor' }).sort({ name: 1 }).limit(5);
  console.log('\nSample vendor accounts:');
  for (const v of sampleVendors) {
    console.log(`  - ${v.name} (${v.email}) company: ${v.company || 'N/A'}`);
  }

  const totalVendors = await User.countDocuments({ role: 'vendor' });
  console.log(`\nTotal vendor accounts in DB: ${totalVendors}`);

  await mongoose.connection.close();
  console.log('Done!');
}

importVendors().catch(err => {
  console.error('Import failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
