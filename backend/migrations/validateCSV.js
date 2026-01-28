const fs = require('fs');
const csv = require('csv-parser');

/**
 * Validate CSV file before import (Dry Run)
 *
 * This script validates your CSV file without importing to the database.
 * Use this to check for errors before running the actual migration.
 *
 * Usage: node validateCSV.js <csv-file-path>
 * Example: node validateCSV.js owners-export.csv
 */

const parseArrayField = (value) => {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
};

const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  const re = /^[\+]?[0-9]{1,4}[-\s]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return re.test(phone);
};

const validateCSV = async (csvFilePath) => {
  try {
    if (!fs.existsSync(csvFilePath)) {
      console.error(`\n❌ Error: File not found: ${csvFilePath}\n`);
      process.exit(1);
    }

    const records = [];
    const errors = [];
    const warnings = [];
    const emails = new Set();
    let lineNumber = 1;

    console.log('\n🔍 Validating CSV file...\n');

    // Read and validate CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          const rowErrors = [];
          const rowWarnings = [];

          // Required: name
          if (!row.name || !row.name.trim()) {
            rowErrors.push('Missing name');
          }

          // Required: email
          if (!row.email || !row.email.trim()) {
            rowErrors.push('Missing email');
          } else {
            const email = row.email.trim().toLowerCase();

            // Validate email format
            if (!validateEmail(email)) {
              rowErrors.push(`Invalid email format: ${email}`);
            }

            // Check for duplicate emails in CSV
            if (emails.has(email)) {
              rowErrors.push(`Duplicate email in CSV: ${email}`);
            } else {
              emails.add(email);
            }
          }

          // Optional but validate if present: phone
          if (row.phone && !validatePhone(row.phone)) {
            rowWarnings.push(`Invalid phone format: ${row.phone}`);
          }

          // Validate coordinates if present
          if (row.longitude || row.latitude) {
            const lng = parseFloat(row.longitude);
            const lat = parseFloat(row.latitude);

            if (isNaN(lng) || isNaN(lat)) {
              rowWarnings.push('Invalid longitude/latitude format');
            } else if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
              rowWarnings.push('Longitude/Latitude out of valid range');
            }
          }

          // Validate years in business
          if (row.yearsInBusiness && isNaN(parseInt(row.yearsInBusiness))) {
            rowWarnings.push(`Invalid yearsInBusiness: ${row.yearsInBusiness}`);
          }

          // Validate open date
          if (row.openDate) {
            const date = new Date(row.openDate);
            if (isNaN(date.getTime())) {
              rowWarnings.push(`Invalid openDate format: ${row.openDate}`);
            }
          }

          // Validate isActive
          if (row.isActive && row.isActive !== 'true' && row.isActive !== 'false') {
            rowWarnings.push(`Invalid isActive value: ${row.isActive} (should be true/false)`);
          }

          // Store record info
          if (rowErrors.length === 0) {
            records.push({
              line: lineNumber,
              name: row.name?.trim(),
              email: row.email?.trim().toLowerCase(),
              hasPassword: !!(row.password && row.password.trim()),
              hasLocation: !!(row.longitude && row.latitude),
              hasAddress: !!(row.street || row.city || row.state),
              hasPhone: !!row.phone,
              hasCompany: !!row.company,
            });
          } else {
            errors.push({
              line: lineNumber,
              errors: rowErrors,
              data: row
            });
          }

          if (rowWarnings.length > 0) {
            warnings.push({
              line: lineNumber,
              warnings: rowWarnings,
              data: row
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Display results
    console.log('='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`\n✅ Valid Records:     ${records.length}`);
    console.log(`❌ Invalid Records:   ${errors.length}`);
    console.log(`⚠️  Warnings:          ${warnings.length}`);
    console.log(`📧 Unique Emails:     ${emails.size}\n`);

    // Show sample of valid records
    if (records.length > 0) {
      console.log('─'.repeat(60));
      console.log('✅ Sample Valid Records (first 5):');
      console.log('─'.repeat(60));
      records.slice(0, 5).forEach(record => {
        console.log(`Line ${record.line}: ${record.name} <${record.email}>`);
        const details = [];
        if (record.hasPassword) details.push('✓ Password');
        if (record.hasLocation) details.push('✓ Location');
        if (record.hasAddress) details.push('✓ Address');
        if (record.hasPhone) details.push('✓ Phone');
        if (record.hasCompany) details.push('✓ Company');
        if (details.length > 0) {
          console.log(`         ${details.join(', ')}`);
        }
      });
      if (records.length > 5) {
        console.log(`         ... and ${records.length - 5} more valid records\n`);
      }
    }

    // Show errors
    if (errors.length > 0) {
      console.log('─'.repeat(60));
      console.log('❌ Invalid Records:');
      console.log('─'.repeat(60));
      errors.forEach(error => {
        console.log(`\nLine ${error.line}:`);
        error.errors.forEach(err => console.log(`   • ${err}`));
        console.log(`   Data: ${JSON.stringify(error.data)}`);
      });
      console.log('');
    }

    // Show warnings
    if (warnings.length > 0) {
      console.log('─'.repeat(60));
      console.log('⚠️  Warnings (non-blocking):');
      console.log('─'.repeat(60));
      warnings.slice(0, 10).forEach(warning => {
        console.log(`\nLine ${warning.line}:`);
        warning.warnings.forEach(warn => console.log(`   • ${warn}`));
      });
      if (warnings.length > 10) {
        console.log(`\n   ... and ${warnings.length - 10} more warnings`);
      }
      console.log('');
    }

    // Summary and recommendations
    console.log('='.repeat(60));
    console.log('📋 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(60));

    if (errors.length === 0) {
      console.log('\n✅ CSV file is valid and ready for import!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run: npm run migrate:owners ' + csvFilePath);
      console.log('   2. Or: node backend/migrations/importOwnersFromCSV.js ' + csvFilePath);

      if (warnings.length > 0) {
        console.log('\n⚠️  Note: There are warnings, but they won\'t prevent import.');
        console.log('   Review them above to ensure data quality.');
      }

      // Provide statistics
      const withPassword = records.filter(r => r.hasPassword).length;
      const withoutPassword = records.length - withPassword;
      const withLocation = records.filter(r => r.hasLocation).length;
      const withAddress = records.filter(r => r.hasAddress).length;

      console.log('\n📊 Data Completeness:');
      console.log(`   • With custom password:  ${withPassword} (${Math.round(withPassword/records.length*100)}%)`);
      console.log(`   • Using default password: ${withoutPassword} (${Math.round(withoutPassword/records.length*100)}%)`);
      console.log(`   • With map coordinates:   ${withLocation} (${Math.round(withLocation/records.length*100)}%)`);
      console.log(`   • With address info:      ${withAddress} (${Math.round(withAddress/records.length*100)}%)`);

      if (withoutPassword > 0) {
        console.log(`\n⚠️  ${withoutPassword} user(s) will get default password: "SignWorld2024!"`);
        console.log('   Remember to send them welcome emails!');
      }

      if (withLocation < records.length) {
        console.log(`\n📍 ${records.length - withLocation} user(s) missing map coordinates`);
        console.log('   They can add this later in their profile');
      }

    } else {
      console.log('\n❌ CSV file has errors that must be fixed before import.');
      console.log('\n📝 Action required:');
      console.log('   1. Fix the errors listed above');
      console.log('   2. Re-run validation: node validateCSV.js ' + csvFilePath);
      console.log('   3. Once valid, run the import');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
};

// Get CSV file path from command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('\n❌ Error: CSV file path required');
  console.log('\nUsage: node validateCSV.js <csv-file-path>');
  console.log('Example: node validateCSV.js owners-export.csv\n');
  process.exit(1);
}

// Run validation
validateCSV(csvFilePath);
