const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

/**
 * Map scraped columns to proper field names
 *
 * Converts generic column_0, column_1, etc. to proper names
 * like name, phone, email, etc.
 *
 * Usage: node mapColumns.js owners-scraped-complete.csv
 * Output: owners-mapped.csv
 */

// Column mapping based on the scraped data
const COLUMN_MAP = {
  'column_0': 'id',              // Row number
  'column_1': 'name',            // Owner name
  'column_2': 'phone',           // Phone number
  'column_3': 'email',           // Email (also in email field)
  'column_4': 'openDate',        // Year opened
  'column_5': 'street',          // Street address
  'column_6': 'city',            // City
  'column_7': 'state',           // State
  'column_8': 'country',         // Country
  'column_9': 'zipCode',         // Zip code
  'column_10': 'hasWebsite',     // "Web" indicator
  'column_11': 'hasProfile',     // "Profile" indicator
  'column_12': 'company',        // Company name
  'column_13': 'operationType',  // Physical Operation, etc.
  'column_14': 'specialties',    // Services/specialties
  // These are already properly named:
  'email': 'email',
  'website': 'profileUrl',       // This is the old profile URL, not business website
};

const mapColumns = async (inputFile) => {
  try {
    if (!fs.existsSync(inputFile)) {
      console.error(`\n❌ File not found: ${inputFile}\n`);
      process.exit(1);
    }

    console.log('\n🔄 Mapping columns to proper field names...\n');

    const records = [];

    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(inputFile)
        .pipe(csv())
        .on('data', (row) => {
          const mapped = {};

          // Map each column to proper name
          Object.entries(row).forEach(([oldKey, value]) => {
            const newKey = COLUMN_MAP[oldKey] || oldKey;
            mapped[newKey] = value;
          });

          // Clean up the data
          const cleaned = {
            name: mapped.name || '',
            email: mapped.email || '',
            phone: mapped.phone || '',
            company: mapped.company || '',

            // Address components
            street: mapped.street || '',
            city: mapped.city || '',
            state: mapped.state || '',
            zipCode: mapped.zipCode || '',
            country: mapped.country || 'USA',

            // Social links
            website: mapped.website || '',
            facebook: mapped.facebook || '',
            linkedin: mapped.linkedin || '',
            instagram: mapped.instagram || '',

            // Dates and years
            openDate: mapped.openDate ? (mapped.openDate.includes('-') ? mapped.openDate : `${mapped.openDate}-01-01`) : '', // Convert year to date if needed
            yearsInBusiness: mapped.yearsInBusiness || '',

            // Profile data
            bio: mapped.bio || '',
            territory: mapped.territory || '',
            profileImage: mapped.profileImage || '',

            // Array fields (comma-separated)
            specialties: mapped.specialties || '',
            equipment: mapped.equipment || '',
            certifications: mapped.certifications || '',

            // Numeric fields
            awards: mapped.awards || '',

            // Location coordinates
            longitude: mapped.longitude || '',
            latitude: mapped.latitude || '',

            // Auth
            password: '', // Will use default password
            isActive: 'true',
          };

          records.push(cleaned);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`✅ Processed ${records.length} records\n`);

    // Convert to CSV with proper column names
    const parser = new Parser({
      fields: [
        'name', 'email', 'password', 'phone', 'company',
        'street', 'city', 'state', 'zipCode', 'country',
        'website', 'facebook', 'linkedin', 'instagram',
        'yearsInBusiness', 'openDate',
        'specialties', 'equipment', 'profileImage',
        'longitude', 'latitude',
        'bio', 'territory', 'certifications', 'awards',
        'isActive'
      ]
    });
    const csvOutput = parser.parse(records);

    // Save mapped file
    const outputFile = 'owners-mapped.csv';
    fs.writeFileSync(outputFile, csvOutput);

    console.log('='.repeat(70));
    console.log('✅ COLUMN MAPPING COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📄 Input:  ${inputFile}`);
    console.log(`📄 Output: ${outputFile}`);
    console.log(`📊 Records: ${records.length}`);

    console.log('\n📋 Mapped Fields:');
    console.log('   ✅ Basic: name, email, phone, company');
    console.log('   ✅ Address: street, city, state, zipCode, country');
    console.log('   ✅ Social: website, facebook, linkedin, instagram');
    console.log('   ✅ Profile: bio, territory, profileImage');
    console.log('   ✅ Business: specialties, equipment, certifications, awards');
    console.log('   ✅ Dates: openDate, yearsInBusiness');
    console.log('   ✅ Location: longitude, latitude');

    console.log('\n⚠️  Note:');
    console.log('   • password - will use default: SignWorld2024!');
    console.log('   • Empty fields can be filled later by users in their profiles');

    console.log('\n📝 Next steps:');
    console.log('   1. Validate: npm run migrate:validate ' + outputFile);
    console.log('   2. Import:   npm run migrate:owners ' + outputFile);
    console.log('\n' + '='.repeat(70) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Mapping failed:', error);
    process.exit(1);
  }
};

// Get input file
const inputFile = process.argv[2] || 'owners-scraped-complete.csv';

mapColumns(inputFile);
