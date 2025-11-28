/**
 * Seed script to add location coordinates to existing owners
 * Run with: node scripts/seedLocations.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

// Sample location data for sign company owners across the US
const locationData = [
  {
    city: 'Phoenix',
    state: 'AZ',
    coordinates: [-112.0740, 33.4484], // [lng, lat]
    zipCode: '85001',
    street: '123 E Washington St'
  },
  {
    city: 'Scottsdale',
    state: 'AZ',
    coordinates: [-111.9261, 33.4942],
    zipCode: '85250',
    street: '456 N Scottsdale Rd'
  },
  {
    city: 'Los Angeles',
    state: 'CA',
    coordinates: [-118.2437, 34.0522],
    zipCode: '90001',
    street: '789 S Main St'
  },
  {
    city: 'San Diego',
    state: 'CA',
    coordinates: [-117.1611, 32.7157],
    zipCode: '92101',
    street: '101 Harbor Dr'
  },
  {
    city: 'Denver',
    state: 'CO',
    coordinates: [-104.9903, 39.7392],
    zipCode: '80202',
    street: '200 E Colfax Ave'
  },
  {
    city: 'Austin',
    state: 'TX',
    coordinates: [-97.7431, 30.2672],
    zipCode: '78701',
    street: '300 Congress Ave'
  },
  {
    city: 'Dallas',
    state: 'TX',
    coordinates: [-96.7970, 32.7767],
    zipCode: '75201',
    street: '400 Main St'
  },
  {
    city: 'Houston',
    state: 'TX',
    coordinates: [-95.3698, 29.7604],
    zipCode: '77002',
    street: '500 Texas Ave'
  },
  {
    city: 'Seattle',
    state: 'WA',
    coordinates: [-122.3321, 47.6062],
    zipCode: '98101',
    street: '600 Pike St'
  },
  {
    city: 'Portland',
    state: 'OR',
    coordinates: [-122.6765, 45.5152],
    zipCode: '97201',
    street: '700 SW Broadway'
  },
  {
    city: 'Las Vegas',
    state: 'NV',
    coordinates: [-115.1398, 36.1699],
    zipCode: '89101',
    street: '800 Fremont St'
  },
  {
    city: 'Miami',
    state: 'FL',
    coordinates: [-80.1918, 25.7617],
    zipCode: '33101',
    street: '900 Brickell Ave'
  },
  {
    city: 'Atlanta',
    state: 'GA',
    coordinates: [-84.3880, 33.7490],
    zipCode: '30303',
    street: '1000 Peachtree St'
  },
  {
    city: 'Chicago',
    state: 'IL',
    coordinates: [-87.6298, 41.8781],
    zipCode: '60601',
    street: '1100 Michigan Ave'
  },
  {
    city: 'New York',
    state: 'NY',
    coordinates: [-74.0060, 40.7128],
    zipCode: '10001',
    street: '1200 Broadway'
  }
];

// Business hours template
const businessHours = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true }
};

const seedLocations = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all owners without location data
    const owners = await User.find({
      role: 'owner',
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': [] },
        { 'location.coordinates': null }
      ]
    });

    console.log(`Found ${owners.length} owners without location data`);

    if (owners.length === 0) {
      console.log('All owners already have location data');

      // Update existing owners to ensure 2dsphere index
      const ownersWithLocation = await User.find({
        role: 'owner',
        'location.coordinates.0': { $exists: true }
      });
      console.log(`Found ${ownersWithLocation.length} owners with location data`);

      await mongoose.disconnect();
      return;
    }

    // Assign location data to owners
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const locationIndex = i % locationData.length;
      const location = locationData[locationIndex];

      // Update owner with location data
      await User.findByIdAndUpdate(owner._id, {
        $set: {
          'address.street': location.street,
          'address.city': location.city,
          'address.state': location.state,
          'address.zipCode': location.zipCode,
          'address.country': 'USA',
          location: {
            type: 'Point',
            coordinates: location.coordinates
          },
          businessHours: businessHours
        }
      });

      console.log(`Updated owner ${owner.name} with ${location.city}, ${location.state} location`);
    }

    // Create 2dsphere index if it doesn't exist
    try {
      await User.collection.createIndex({ 'location': '2dsphere' });
      console.log('Created 2dsphere index on location field');
    } catch (indexError) {
      if (indexError.code === 85 || indexError.code === 86) {
        console.log('2dsphere index already exists');
      } else {
        console.error('Error creating index:', indexError.message);
      }
    }

    console.log(`\nSuccessfully updated ${owners.length} owners with location data`);

    // Verify the update
    const updatedCount = await User.countDocuments({
      role: 'owner',
      'location.coordinates.0': { $exists: true }
    });
    console.log(`Total owners with location data: ${updatedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  }
};

// Run the seed function
seedLocations();
