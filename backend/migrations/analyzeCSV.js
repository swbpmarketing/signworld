const fs = require('fs');
const csv = require('csv-parser');

/**
 * Analyze CSV to see what data is present/missing
 *
 * This helps you understand what fields you have in your CSV
 * and what's missing compared to what the new system supports.
 *
 * Usage: node analyzeCSV.js <csv-file-path>
 */

const analyzeCSV = async (csvFilePath) => {
  try {
    if (!fs.existsSync(csvFilePath)) {
      console.error(`\n❌ File not found: ${csvFilePath}\n`);
      process.exit(1);
    }

    const records = [];
    const allFields = new Set();
    let lineNumber = 0;

    console.log('\n📊 Analyzing CSV file...\n');

    // Read CSV and collect all fields
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          records.push(row);
          Object.keys(row).forEach(field => allFields.add(field));
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log('='.repeat(70));
    console.log('📋 CSV ANALYSIS REPORT');
    console.log('='.repeat(70));
    console.log(`\n📄 File: ${csvFilePath}`);
    console.log(`📊 Total records: ${records.length}`);
    console.log(`📑 Fields found: ${allFields.size}\n`);

    // Required fields by new system
    const REQUIRED_FIELDS = ['name', 'email'];
    const OPTIONAL_FIELDS = [
      'password', 'phone', 'company',
      'street', 'city', 'state', 'zipCode', 'country',
      'website', 'facebook', 'linkedin', 'instagram',
      'yearsInBusiness', 'openDate', 'specialties', 'equipment',
      'profileImage', 'longitude', 'latitude', 'isActive'
    ];

    // Check what fields are present
    const presentFields = Array.from(allFields);
    const missingRequired = REQUIRED_FIELDS.filter(f => !allFields.has(f));
    const missingOptional = OPTIONAL_FIELDS.filter(f => !allFields.has(f));
    const extraFields = presentFields.filter(f =>
      !REQUIRED_FIELDS.includes(f) && !OPTIONAL_FIELDS.includes(f)
    );

    // Field completeness analysis
    const fieldStats = {};
    presentFields.forEach(field => {
      const filled = records.filter(r => r[field] && r[field].trim() !== '').length;
      const empty = records.length - filled;
      fieldStats[field] = {
        filled,
        empty,
        percentage: Math.round((filled / records.length) * 100)
      };
    });

    // Display current fields
    console.log('─'.repeat(70));
    console.log('✅ FIELDS IN YOUR CSV:');
    console.log('─'.repeat(70));

    if (presentFields.length === 0) {
      console.log('⚠️  No fields detected! Check CSV format.');
    } else {
      presentFields.sort().forEach(field => {
        const stats = fieldStats[field];
        const bar = '█'.repeat(Math.floor(stats.percentage / 5));
        const isRequired = REQUIRED_FIELDS.includes(field);
        const marker = isRequired ? '⭐' : '  ';
        console.log(`${marker} ${field.padEnd(20)} ${bar} ${stats.percentage}% (${stats.filled}/${records.length})`);
      });
    }

    // Display missing fields
    if (missingRequired.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('❌ MISSING REQUIRED FIELDS:');
      console.log('─'.repeat(70));
      missingRequired.forEach(field => {
        console.log(`   • ${field} - CRITICAL! Must have this field`);
      });
    }

    if (missingOptional.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('⚠️  MISSING OPTIONAL FIELDS (will be empty in new system):');
      console.log('─'.repeat(70));

      // Group by category
      const addressFields = ['street', 'city', 'state', 'zipCode', 'country'];
      const socialFields = ['website', 'facebook', 'linkedin', 'instagram'];
      const businessFields = ['company', 'yearsInBusiness', 'openDate', 'specialties', 'equipment'];
      const locationFields = ['longitude', 'latitude'];
      const otherFields = ['phone', 'profileImage', 'isActive', 'password'];

      const printMissing = (category, fields) => {
        const missing = fields.filter(f => missingOptional.includes(f));
        if (missing.length > 0) {
          console.log(`\n   ${category}:`);
          missing.forEach(f => console.log(`      • ${f}`));
        }
      };

      printMissing('📍 Address', addressFields);
      printMissing('🌐 Social Links', socialFields);
      printMissing('🏢 Business Info', businessFields);
      printMissing('📍 Map Location', locationFields);
      printMissing('📱 Contact & Profile', otherFields);
    }

    // Extra fields in CSV
    if (extraFields.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('ℹ️  EXTRA FIELDS (not used by import script):');
      console.log('─'.repeat(70));
      extraFields.forEach(field => {
        console.log(`   • ${field} (${fieldStats[field].filled} filled)`);
      });
      console.log('\n   These fields won\'t be imported. Consider if they should be mapped.');
    }

    // Sample data
    console.log('\n' + '─'.repeat(70));
    console.log('📋 SAMPLE RECORDS (first 3):');
    console.log('─'.repeat(70));
    records.slice(0, 3).forEach((record, i) => {
      console.log(`\n${i + 1}. ${record.name || '(no name)'} <${record.email || '(no email)'}>`);
      Object.entries(record).slice(0, 8).forEach(([key, value]) => {
        if (value && value.trim()) {
          const display = value.length > 40 ? value.substring(0, 40) + '...' : value;
          console.log(`   ${key}: ${display}`);
        }
      });
    });

    // Recommendations
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS:');
    console.log('='.repeat(70));

    if (missingRequired.length > 0) {
      console.log('\n❌ CRITICAL: Cannot import without required fields!');
      console.log('   Fix: Add these columns to your CSV:');
      missingRequired.forEach(f => console.log(`      • ${f}`));
    } else {
      console.log('\n✅ CSV has all required fields and can be imported!');

      if (missingOptional.length > 0) {
        console.log('\n⚠️  However, you\'re missing optional data:');
        console.log(`   • ${missingOptional.length} optional fields are empty`);
        console.log('   • Users can fill these later in their profiles');
        console.log('   • Or you can enrich the CSV with data from old system');

        console.log('\n📝 Options to get complete data:');
        console.log('   1. Export directly from old database (fastest)');
        console.log('      → Use: node backend/migrations/exportFromOldDB.js');
        console.log('   2. Manually add missing columns to CSV');
        console.log('   3. Import as-is and let users update profiles later');
      }

      // Check data quality
      const lowQualityFields = Object.entries(fieldStats)
        .filter(([_, stats]) => stats.percentage < 50)
        .map(([field]) => field);

      if (lowQualityFields.length > 0) {
        console.log('\n⚠️  Data Quality Issues:');
        console.log('   These fields are less than 50% complete:');
        lowQualityFields.forEach(f => {
          console.log(`      • ${f} (${fieldStats[f].percentage}% filled)`);
        });
      }

      // Next steps
      console.log('\n📝 Next Steps:');
      if (missingOptional.length === 0 && lowQualityFields.length === 0) {
        console.log('   Your CSV looks great! Ready to import:');
      } else {
        console.log('   Your CSV can be imported, but consider enriching it first:');
      }
      console.log('   1. Validate: npm run migrate:validate ' + csvFilePath);
      console.log('   2. Import:   npm run migrate:owners ' + csvFilePath);
    }

    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
};

// Get CSV file path
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('\n❌ Error: CSV file path required');
  console.log('\nUsage: node analyzeCSV.js <csv-file-path>');
  console.log('Example: node analyzeCSV.js owners-incomplete.csv\n');
  process.exit(1);
}

analyzeCSV(csvFilePath);
