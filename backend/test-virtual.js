const connectDB = require('./config/db');
const Convention = require('./models/Convention');

connectDB().then(async () => {
  try {
    console.log('Testing virtual field...');

    const convention = await Convention.findOne({ _id: '69244b4ea692336b4a87aaf5' });

    if (!convention) {
      console.log('Convention not found');
      process.exit(0);
    }

    console.log('Convention found:', convention.title);
    console.log('Start Date:', convention.startDate);
    console.log('End Date:', convention.endDate);

    // Test if virtual field exists
    console.log('Virtual status (direct):', convention.status);

    // Test toJSON
    const json = convention.toJSON();
    console.log('toJSON status field:', json.status);
    console.log('toJSON keys:', Object.keys(json).length);
    console.log('Has status in toJSON:', 'status' in json);

    // Test toObject
    const obj = convention.toObject({ virtuals: true });
    console.log('toObject status field:', obj.status);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('DB connection error:', err.message);
  process.exit(1);
});
