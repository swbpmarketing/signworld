const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');

// Load env vars
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedEvents = async () => {
  try {
    await connectDB();

    // Find an admin user to be the organizer
    let organizer = await User.findOne({ role: 'admin' });
    
    if (!organizer) {
      console.log('No admin user found. Creating a default organizer...');
      organizer = await User.create({
        name: 'System Admin',
        email: 'admin@signcompany.com',
        password: 'temppass123',
        role: 'admin',
        emailVerified: true,
        isActive: true
      });
    }

    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Sample events data
    const events = [
      {
        title: 'Monthly Owner Meeting',
        description: 'Monthly meeting to discuss Q3 goals and performance metrics. Review sales figures, upcoming projects, and team updates.',
        startDate: new Date('2025-08-15T14:00:00.000Z'),
        endDate: new Date('2025-08-15T15:30:00.000Z'),
        category: 'meeting',
        color: '#00A6FB',
        location: 'Virtual - Zoom',
        isOnline: true,
        onlineLink: 'https://zoom.us/j/123456789',
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Sign Design Workshop',
        description: 'Learn advanced techniques for creating eye-catching sign designs. Hands-on workshop with industry experts.',
        startDate: new Date('2025-08-08T10:00:00.000Z'),
        endDate: new Date('2025-08-08T12:00:00.000Z'),
        category: 'training',
        color: '#10B981',
        location: 'Training Center - Room A',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Annual Convention 2025',
        description: 'The biggest Sign Company event of the year! Network with industry professionals, learn about new trends, and celebrate our achievements.',
        startDate: new Date('2025-08-22T09:00:00.000Z'),
        endDate: new Date('2025-08-24T17:00:00.000Z'),
        category: 'convention',
        color: '#8B5CF6',
        location: 'Las Vegas Convention Center',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Digital Marketing Webinar',
        description: 'Discover effective strategies for growing your sign business with digital marketing. Topics include SEO, social media, and online advertising.',
        startDate: new Date('2025-08-18T13:00:00.000Z'),
        endDate: new Date('2025-08-18T14:00:00.000Z'),
        category: 'webinar',
        color: '#F59E0B',
        location: 'Online',
        isOnline: true,
        onlineLink: 'https://teams.microsoft.com/l/meetup-join/12345',
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Summer BBQ & Team Building',
        description: 'Join us for our annual summer BBQ and team building activities. Great food, fun games, and time to connect with colleagues.',
        startDate: new Date('2025-08-25T12:00:00.000Z'),
        endDate: new Date('2025-08-25T16:00:00.000Z'),
        category: 'social',
        color: '#EC4899',
        location: 'Company Headquarters - Outdoor Area',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Equipment Maintenance Training',
        description: 'Essential training on proper maintenance and care of sign-making equipment. Preventive maintenance schedules and troubleshooting tips.',
        startDate: new Date('2025-09-05T09:00:00.000Z'),
        endDate: new Date('2025-09-05T11:00:00.000Z'),
        category: 'training',
        color: '#10B981',
        location: 'Workshop Floor',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Q3 Business Review',
        description: 'Quarterly business review meeting covering financial performance, market analysis, and strategic planning for Q4.',
        startDate: new Date('2025-09-15T10:00:00.000Z'),
        endDate: new Date('2025-09-15T12:00:00.000Z'),
        category: 'meeting',
        color: '#00A6FB',
        location: 'Conference Room B',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      }
    ];

    // Create events
    const createdEvents = await Event.create(events);
    console.log(`Created ${createdEvents.length} sample events`);

    console.log('\nSample events seeded successfully!');
    console.log('Events created:');
    createdEvents.forEach(event => {
      console.log(`- ${event.title} (${event.category}) - ${event.startDate.toDateString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
};

// Run the seeder
seedEvents();