const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

/**
 * Bulk Import Owners from CSV
 *
 * CSV Format Expected:
 * name,email,phone,company,street,city,state,zipCode,country,website,facebook,linkedin,instagram,yearsInBusiness,openDate,specialties,equipment,profileImage,longitude,latitude,bio,territory,certifications,awards
 *
 * Usage: node importOwnersFromCSV.js <csv-file-path>
 * Example: node importOwnersFromCSV.js owners-export.csv
 */

const DEFAULT_PASSWORD = 'SignWorld2024!'; // Users will be prompted to change on first login

// Helper function to parse comma-separated values into arrays
const parseArrayField = (value) => {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
};

// Helper function to geocode address (using a simple approach)
const geocodeAddress = async (address) => {
  // In production, you'd use Google Maps Geocoding API or similar
  // For now, return null - can be updated later via the map interface
  return null;
};

const importOwners = async (csvFilePath) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const owners = [];
    const errors = [];
    let lineNumber = 1;

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Skip if no email
            if (!row.email || !row.email.trim()) {
              errors.push({ line: lineNumber, error: 'Missing email', data: row });
              return;
            }

            // Skip if no name
            if (!row.name || !row.name.trim()) {
              errors.push({ line: lineNumber, error: 'Missing name', data: row });
              return;
            }

            const owner = {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              password: row.password && row.password.trim() ? row.password.trim() : DEFAULT_PASSWORD,
              role: 'owner',
              phone: row.phone ? row.phone.trim() : undefined,
              company: row.company ? row.company.trim() : undefined,
              address: {},
              socialLinks: {},
              isActive: row.isActive === 'false' ? false : true,
              emailVerified: true, // Auto-verify migrated users
            };

            // Address fields
            if (row.street) owner.address.street = row.street.trim();
            if (row.city) owner.address.city = row.city.trim();
            if (row.state) owner.address.state = row.state.trim();
            if (row.zipCode) owner.address.zipCode = row.zipCode.trim();
            if (row.country) owner.address.country = row.country.trim();

            // Only include address if at least one field is present
            if (Object.keys(owner.address).length === 0) {
              delete owner.address;
            }

            // Social links
            if (row.website) owner.socialLinks.website = row.website.trim();
            if (row.facebook) owner.socialLinks.facebook = row.facebook.trim();
            if (row.linkedin) owner.socialLinks.linkedin = row.linkedin.trim();
            if (row.instagram) owner.socialLinks.instagram = row.instagram.trim();

            // Only include socialLinks if at least one field is present
            if (Object.keys(owner.socialLinks).length === 0) {
              delete owner.socialLinks;
            }

            // Years in business
            if (row.yearsInBusiness && !isNaN(row.yearsInBusiness)) {
              owner.yearsInBusiness = parseInt(row.yearsInBusiness);
            }

            // Open date
            if (row.openDate) {
              const date = new Date(row.openDate);
              if (!isNaN(date.getTime())) {
                owner.openDate = date;
              }
            }

            // Specialties (comma-separated in CSV)
            if (row.specialties) {
              owner.specialties = parseArrayField(row.specialties);
            }

            // Equipment (comma-separated in CSV)
            if (row.equipment) {
              owner.equipment = parseArrayField(row.equipment);
            }

            // Profile image URL
            if (row.profileImage) {
              owner.profileImage = row.profileImage.trim();
            }

            // Longitude and Latitude for location
            if (row.longitude && row.latitude && !isNaN(row.longitude) && !isNaN(row.latitude)) {
              owner.location = {
                type: 'Point',
                coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
              };
            }

            // Bio
            if (row.bio) {
              owner.bio = row.bio.trim();
            }

            // Territory
            if (row.territory) {
              owner.territory = row.territory.trim();
            }

            // Certifications (comma-separated in CSV)
            if (row.certifications) {
              owner.certifications = parseArrayField(row.certifications);
            }

            // Awards count
            if (row.awards && !isNaN(row.awards)) {
              owner.awards = parseInt(row.awards);
            }

            owners.push(owner);
          } catch (err) {
            errors.push({ line: lineNumber, error: err.message, data: row });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`\n📊 CSV Processing Complete:`);
    console.log(`   ✓ Valid records: ${owners.length}`);
    console.log(`   ✗ Invalid records: ${errors.length}\n`);

    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(err => {
        console.log(`   Line ${err.line}: ${err.error}`);
        console.log(`   Data: ${JSON.stringify(err.data)}\n`);
      });
    }

    if (owners.length === 0) {
      console.log('⚠️  No valid records to import. Exiting...');
      process.exit(0);
    }

    // Ask for confirmation
    console.log(`\n⚠️  About to import ${owners.length} owner(s) with default password: "${DEFAULT_PASSWORD}"`);
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Bulk insert/update with error handling
    let successCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    console.log('🚀 Starting bulk import/update...\n');

    for (const owner of owners) {
      try {
        // Check if email already exists
        const existingUser = await User.findOne({ email: owner.email });
        if (existingUser) {
          // Update existing user with new fields (preserve existing password and other sensitive data)
          const updateData = { ...owner };
          delete updateData.password; // Don't overwrite existing password
          delete updateData.email; // Don't change email
          delete updateData.role; // Don't change role

          await User.findByIdAndUpdate(existingUser._id, updateData, { new: true });
          updatedCount++;
          console.log(`🔄 Updated: ${owner.name} (${owner.email})`);
        } else {
          // Create new user
          await User.create(owner);
          successCount++;
          console.log(`✅ Created: ${owner.name} (${owner.email})`);
        }
      } catch (err) {
        failedCount++;
        console.log(`❌ Failed to process ${owner.email}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Import Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`🔄 Successfully updated: ${updatedCount}`);
    console.log(`❌ Failed:               ${failedCount}`);
    console.log(`📊 Total processed:      ${owners.length}`);
    console.log('='.repeat(50) + '\n');

    if (successCount > 0) {
      console.log('✉️  IMPORTANT: Send welcome emails to new users with:');
      console.log(`   - Default password: ${DEFAULT_PASSWORD}`);
      console.log('   - Instructions to change password on first login\n');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Get CSV file path from command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('\n❌ Error: CSV file path required');
  console.log('\nUsage: node importOwnersFromCSV.js <csv-file-path>');
  console.log('Example: node importOwnersFromCSV.js owners-export.csv\n');
  console.log('CSV Format (header row required):');
  console.log('name,email,password,phone,company,street,city,state,zipCode,country,website,facebook,linkedin,instagram,yearsInBusiness,openDate,specialties,equipment,profileImage,longitude,latitude,bio,territory,certifications,awards,isActive\n');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`\n❌ Error: File not found: ${csvFilePath}\n`);
  process.exit(1);
}

// Run the import
importOwners(csvFilePath);
