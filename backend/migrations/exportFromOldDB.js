const mongoose = require('mongoose');
const fs = require('fs');
const { Parser } = require('json2csv');

/**
 * Export Owner Data Directly from Old SignWorld Database
 *
 * This script connects to the old database and exports ALL owner data
 * including fields that might not be in CSV exports.
 *
 * Usage:
 * 1. Update OLD_DB_URI with your old database connection string
 * 2. Run: node exportFromOldDB.js
 * 3. Output: owners-complete-export.csv
 */

// ⚠️ CONFIGURE THIS - Connection to OLD database
const OLD_DB_URI = 'mongodb://localhost:27017/old-signworld-db';
// Or if MySQL, you'd use mysql2 package instead

/**
 * Old Database Schema Mapping
 * Adjust these field names to match your old database structure
 */
const OLD_SCHEMA_MAPPING = {
  // Basic fields
  name: 'name', // or 'full_name', 'display_name', etc.
  email: 'email',
  password: 'password', // Usually hashed
  phone: 'phone', // or 'phone_number', 'mobile', etc.
  company: 'company_name', // or 'business_name', etc.

  // Address fields
  street: 'address.street', // or 'street_address', etc.
  city: 'address.city',
  state: 'address.state',
  zipCode: 'address.zip', // or 'postal_code', etc.
  country: 'address.country',

  // Social links
  website: 'website_url', // or 'website', 'web', etc.
  facebook: 'social.facebook',
  linkedin: 'social.linkedin',
  instagram: 'social.instagram',

  // Business info
  yearsInBusiness: 'years_in_business',
  openDate: 'opening_date', // or 'open_date', 'start_date', etc.
  specialties: 'specialties', // Array field
  equipment: 'equipment_list', // Array field

  // Location
  longitude: 'location.coordinates[0]', // or 'lng', 'lon', etc.
  latitude: 'location.coordinates[1]', // or 'lat', etc.

  // Other
  profileImage: 'profile_photo', // or 'avatar', 'photo_url', etc.
  isActive: 'is_active', // or 'active', 'status', etc.
};

// Helper to safely get nested property
const getNestedValue = (obj, path) => {
  if (!path) return undefined;

  try {
    // Handle array notation like 'location.coordinates[0]'
    const arrayMatch = path.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, basePath, index] = arrayMatch;
      const parts = basePath.split('.');
      let value = obj;
      for (const part of parts) {
        if (value === undefined || value === null) return undefined;
        value = value[part];
      }
      return value ? value[parseInt(index)] : undefined;
    }

    // Handle dot notation like 'address.city'
    return path.split('.').reduce((acc, part) =>
      acc && acc[part] !== undefined ? acc[part] : undefined, obj
    );
  } catch (e) {
    return undefined;
  }
};

// Format array fields for CSV
const formatArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value || '';
};

const exportFromOldDB = async () => {
  let oldConnection;

  try {
    console.log('\n🔌 Connecting to old database...');
    console.log(`   URI: ${OLD_DB_URI}\n`);

    // Connect to old database
    oldConnection = await mongoose.createConnection(OLD_DB_URI).asPromise();
    console.log('✅ Connected to old database\n');

    // Get the users collection (adjust collection name if needed)
    const OldUser = oldConnection.model('User', new mongoose.Schema({}, { strict: false }));

    console.log('📊 Fetching owner users...');

    // Query for owners (adjust query as needed)
    const oldUsers = await OldUser.find({
      role: 'owner' // or 'user_type': 'owner', adjust based on your schema
    }).lean();

    console.log(`   Found ${oldUsers.length} owner users\n`);

    if (oldUsers.length === 0) {
      console.log('⚠️  No owner users found. Check your query or database connection.');
      process.exit(0);
    }

    console.log('🔄 Transforming data...\n');

    // Transform old data to new format
    const transformedUsers = oldUsers.map((oldUser, index) => {
      try {
        const transformed = {
          // Get values using the mapping
          name: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.name) || '',
          email: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.email) || '',
          password: '', // Don't export passwords, let script generate new ones
          phone: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.phone) || '',
          company: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.company) || '',
          street: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.street) || '',
          city: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.city) || '',
          state: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.state) || '',
          zipCode: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.zipCode) || '',
          country: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.country) || 'USA',
          website: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.website) || '',
          facebook: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.facebook) || '',
          linkedin: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.linkedin) || '',
          instagram: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.instagram) || '',
          yearsInBusiness: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.yearsInBusiness) || '',
          openDate: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.openDate) || '',
          specialties: formatArrayField(getNestedValue(oldUser, OLD_SCHEMA_MAPPING.specialties)),
          equipment: formatArrayField(getNestedValue(oldUser, OLD_SCHEMA_MAPPING.equipment)),
          profileImage: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.profileImage) || '',
          longitude: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.longitude) || '',
          latitude: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.latitude) || '',
          isActive: getNestedValue(oldUser, OLD_SCHEMA_MAPPING.isActive) !== false ? 'true' : 'false',
        };

        // Show sample of first 3 records
        if (index < 3) {
          console.log(`✓ User ${index + 1}: ${transformed.name} <${transformed.email}>`);
        }

        return transformed;
      } catch (error) {
        console.error(`❌ Error transforming user ${index + 1}:`, error.message);
        return null;
      }
    }).filter(user => user !== null);

    console.log(`\n✅ Transformed ${transformedUsers.length} users\n`);

    // Convert to CSV
    console.log('📝 Generating CSV...');
    const parser = new Parser({
      fields: [
        'name', 'email', 'password', 'phone', 'company',
        'street', 'city', 'state', 'zipCode', 'country',
        'website', 'facebook', 'linkedin', 'instagram',
        'yearsInBusiness', 'openDate', 'specialties', 'equipment',
        'profileImage', 'longitude', 'latitude', 'isActive'
      ]
    });
    const csv = parser.parse(transformedUsers);

    // Write to file
    const outputFile = 'owners-complete-export.csv';
    fs.writeFileSync(outputFile, csv);

    console.log('\n' + '='.repeat(60));
    console.log('✅ EXPORT SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log(`\n📄 File created: ${outputFile}`);
    console.log(`📊 Total records: ${transformedUsers.length}`);

    // Show data completeness
    const withPhone = transformedUsers.filter(u => u.phone).length;
    const withAddress = transformedUsers.filter(u => u.street || u.city).length;
    const withLocation = transformedUsers.filter(u => u.longitude && u.latitude).length;
    const withWebsite = transformedUsers.filter(u => u.website).length;

    console.log('\n📊 Data Completeness:');
    console.log(`   • With phone:     ${withPhone}/${transformedUsers.length} (${Math.round(withPhone/transformedUsers.length*100)}%)`);
    console.log(`   • With address:   ${withAddress}/${transformedUsers.length} (${Math.round(withAddress/transformedUsers.length*100)}%)`);
    console.log(`   • With location:  ${withLocation}/${transformedUsers.length} (${Math.round(withLocation/transformedUsers.length*100)}%)`);
    console.log(`   • With website:   ${withWebsite}/${transformedUsers.length} (${Math.round(withWebsite/transformedUsers.length*100)}%)`);

    console.log('\n📝 Next steps:');
    console.log('   1. Validate: npm run migrate:validate ' + outputFile);
    console.log('   2. Import:   npm run migrate:owners ' + outputFile);
    console.log('\n' + '='.repeat(60) + '\n');

    await oldConnection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    if (oldConnection) await oldConnection.close();
    process.exit(1);
  }
};

// Check if json2csv is installed
try {
  require.resolve('json2csv');
} catch (e) {
  console.error('\n❌ Missing dependency: json2csv');
  console.log('\nInstall it with: npm install json2csv --save-dev\n');
  process.exit(1);
}

// Instructions
console.log('\n' + '='.repeat(60));
console.log('📦 OLD DATABASE EXPORT TOOL');
console.log('='.repeat(60));
console.log('\n⚠️  BEFORE RUNNING:');
console.log('   1. Update OLD_DB_URI (line 16) with your database connection');
console.log('   2. Update OLD_SCHEMA_MAPPING (lines 24-53) to match your schema');
console.log('   3. Ensure you have read access to the old database\n');

// exportFromOldDB();

// Uncomment the line above after configuration
console.log('⚠️  Script configured but not running yet.');
console.log('   Uncomment line 171 to enable after configuration.\n');
