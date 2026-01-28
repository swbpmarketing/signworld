const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const fs = require('fs');
require('dotenv').config();

const User = require('../models/User');

/**
 * Export Users for GoHighLevel Email Campaign
 *
 * Exports all owner users to CSV format for uploading to GoHighLevel.
 * Includes: name, email, company, phone, address, etc.
 *
 * Usage: node exportForGoHighLevel.js
 * Output: gohighlevel-users-export.csv
 */

const exportForGoHighLevel = async () => {
  try {
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Fetching owner users...');
    const owners = await User.find({ role: 'owner', isActive: true })
      .select('name email phone company address socialLinks createdAt')
      .lean();

    console.log(`   Found ${owners.length} active owners\n`);

    if (owners.length === 0) {
      console.log('⚠️  No owner users found.');
      process.exit(0);
    }

    // Transform data for GoHighLevel
    const ghlData = owners.map(owner => ({
      // Basic Info
      'First Name': owner.name?.split(' ')[0] || '',
      'Last Name': owner.name?.split(' ').slice(1).join(' ') || '',
      'Full Name': owner.name || '',
      'Email': owner.email || '',
      'Phone': owner.phone || '',

      // Business Info
      'Company': owner.company || '',

      // Address
      'Street': owner.address?.street || '',
      'City': owner.address?.city || '',
      'State': owner.address?.state || '',
      'Zip Code': owner.address?.zipCode || '',
      'Country': owner.address?.country || 'USA',

      // Full Address (formatted)
      'Full Address': [
        owner.address?.street,
        owner.address?.city,
        owner.address?.state,
        owner.address?.zipCode
      ].filter(Boolean).join(', '),

      // Social Links
      'Website': owner.socialLinks?.website || '',
      'Facebook': owner.socialLinks?.facebook || '',
      'LinkedIn': owner.socialLinks?.linkedin || '',
      'Instagram': owner.socialLinks?.instagram || '',

      // System Info
      'Created Date': owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : '',

      // Custom Fields for your GoHighLevel campaign
      'Login URL': process.env.FRONTEND_URL || 'https://your-domain.com/login',
      'Default Password': 'SignWorld2024!', // If using default password
      'Status': 'Migrated',
      'Source': 'SignWorld Migration',
    }));

    // Convert to CSV
    console.log('📝 Converting to CSV...');
    const parser = new Parser({
      fields: [
        'First Name', 'Last Name', 'Full Name', 'Email', 'Phone',
        'Company', 'Street', 'City', 'State', 'Zip Code', 'Country', 'Full Address',
        'Website', 'Facebook', 'LinkedIn', 'Instagram',
        'Login URL', 'Default Password', 'Created Date', 'Status', 'Source'
      ]
    });
    const csv = parser.parse(ghlData);

    // Save to file
    const outputFile = 'gohighlevel-users-export.csv';
    fs.writeFileSync(outputFile, csv);

    console.log('\n' + '='.repeat(70));
    console.log('✅ EXPORT SUCCESSFUL!');
    console.log('='.repeat(70));
    console.log(`\n📄 File created: ${outputFile}`);
    console.log(`📊 Total users: ${owners.length}`);

    // Show data completeness
    const withPhone = ghlData.filter(u => u.Phone).length;
    const withCompany = ghlData.filter(u => u.Company).length;
    const withAddress = ghlData.filter(u => u['Full Address']).length;
    const withWebsite = ghlData.filter(u => u.Website).length;

    console.log('\n📊 Data Completeness:');
    console.log(`   • With phone:     ${withPhone}/${owners.length} (${Math.round(withPhone/owners.length*100)}%)`);
    console.log(`   • With company:   ${withCompany}/${owners.length} (${Math.round(withCompany/owners.length*100)}%)`);
    console.log(`   • With address:   ${withAddress}/${owners.length} (${Math.round(withAddress/owners.length*100)}%)`);
    console.log(`   • With website:   ${withWebsite}/${owners.length} (${Math.round(withWebsite/owners.length*100)}%)`);

    console.log('\n📝 Next steps:');
    console.log('   1. Upload CSV to GoHighLevel');
    console.log('   2. Create your welcome email campaign');
    console.log('   3. Map CSV columns to GoHighLevel fields');
    console.log('   4. Send welcome emails from GoHighLevel');

    console.log('\n💡 Email Template Variables Available:');
    console.log('   • {{First Name}}, {{Last Name}}, {{Full Name}}');
    console.log('   • {{Email}}, {{Phone}}, {{Company}}');
    console.log('   • {{Login URL}}, {{Default Password}}');
    console.log('   • {{Full Address}}, {{Website}}');

    console.log('\n' + '='.repeat(70) + '\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

exportForGoHighLevel();
