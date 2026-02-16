const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse/sync');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

// Clean phone number - strip non-numeric except + - ( ) and spaces
function cleanPhone(raw) {
  if (!raw) return '';
  let cleaned = raw.trim();
  if (/[a-zA-Z]/.test(cleaned)) return '';
  cleaned = cleaned.replace(/[^\d\+\-\(\)\s\.]/g, '');
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount < 7) return '';
  return cleaned;
}

function parseCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });
}

async function importOwners() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Read both CSV files
  const csvDir = path.join(__dirname, '..', '..', 'partners data');
  const file1 = path.join(csvDir, 'signworldowners.users.2026-02-16-07-52-24.csv');
  const file2 = path.join(csvDir, 'signworldowners.users.2026-02-16-07-52-47.csv');

  const records1 = parseCSV(file1);
  const records2 = parseCSV(file2);
  const allRecords = [...records1, ...records2];
  console.log(`Parsed ${records1.length} + ${records2.length} = ${allRecords.length} CSV records`);

  // Pre-hash a default password
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('SignworldOwner2024!', salt);

  const emailRegex = /^\w+([\.\-\+]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const seenEmails = new Set();
  let imported = 0;
  let skipped = 0;
  const skipReasons = [];

  for (const record of allRecords) {
    let email = (record.user_email || '').trim().toLowerCase();
    if (email.includes(';')) email = email.split(';')[0].trim();

    if (!email || !emailRegex.test(email)) {
      skipped++;
      skipReasons.push(`Invalid email: "${email}" (${record.display_name || record.company || 'unknown'})`);
      continue;
    }

    if (seenEmails.has(email)) {
      skipped++;
      skipReasons.push(`Duplicate in CSV: "${email}" (${record.display_name || record.company || 'unknown'})`);
      continue;
    }
    seenEmails.add(email);

    // Check if email already exists in DB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      skipped++;
      skipReasons.push(`Already in DB as ${existingUser.role}: "${email}" (${record.display_name || record.company || 'unknown'})`);
      continue;
    }

    const firstName = (record.first_name || '').trim();
    const lastName = (record.last_name || '').trim();
    const name = `${firstName} ${lastName}`.trim() || (record.display_name || '').trim() || (record.company || '').trim() || 'Owner';
    const company = (record.company || record.display_name || '').trim();
    const phone = cleanPhone(record.phone || record.telephone || record.pphone || '');

    const street = (record.address || '').trim();
    const city = (record.city || '').trim();
    const state = (record.state || '').trim();
    const zipCode = (record.zip || '').trim();
    let country = 'USA';
    if (record.country) {
      const c = record.country.toLowerCase().trim();
      if (c === 'canada' || c === 'ca') country = 'Canada';
    }

    const lat = parseFloat(record.latitude);
    const lng = parseFloat(record.longitude);
    const location = (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0)
      ? { type: 'Point', coordinates: [lng, lat] }
      : undefined;

    const specialities = (record.specialities || '').trim();
    const stype = (record.stype || '').trim();
    let specialties = [];
    if (specialities) specialties = specialities.split(',').map(s => s.trim()).filter(Boolean);
    else if (stype) specialties = stype.split(',').map(s => s.trim()).filter(Boolean);

    const equipmentText = (record.equipment || '').trim();
    const equipment = equipmentText ? equipmentText.split(',').map(s => s.trim()).filter(Boolean) : [];

    const bio = equipmentText || specialities || stype || '';

    const socialLinks = {};
    if (record.facebook) socialLinks.facebook = record.facebook.trim();
    if (record.linkedin) socialLinks.linkedin = record.linkedin.trim();
    if (record.instagram) socialLinks.instagram = record.instagram.trim();
    const website = (record.website || record.user_url || '').trim();
    if (website) socialLinks.website = website;

    const isMentor = (record.is_mentor || '').toLowerCase() === 'yes';
    const awards = parseInt(record.awards) || 0;

    // interests field often contains the year they started
    const interests = (record.interests || '').trim();
    const openDate = /^\d{4}$/.test(interests) ? new Date(`${interests}-01-01`) : undefined;

    try {
      await User.collection.insertOne({
        name,
        email,
        password: defaultPasswordHash,
        role: 'owner',
        emailVerified: true,
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
        mentoring: { available: isMentor, areas: [] },
        awards,
        openDate,
        isActive: true,
        createdAt: new Date(),
      });
      imported++;
    } catch (err) {
      skipped++;
      skipReasons.push(`Insert failed for "${email}": ${err.message}`);
    }
  }

  console.log(`\nImported ${imported} owner accounts`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} records:`);
    skipReasons.forEach(r => console.log(`  - ${r}`));
  }

  const totalOwners = await User.countDocuments({ role: 'owner' });
  console.log(`\nTotal owner accounts in DB: ${totalOwners}`);

  const samples = await User.find({ role: 'owner' }).sort({ createdAt: -1 }).limit(5);
  console.log('\nSample owners:');
  for (const o of samples) {
    console.log(`  - ${o.name} (${o.email}) company: ${o.company || 'N/A'}`);
  }

  await mongoose.connection.close();
  console.log('Done!');
}

importOwners().catch(err => {
  console.error('Import failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
