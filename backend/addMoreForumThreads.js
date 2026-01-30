const mongoose = require('mongoose');
const ForumThread = require('./models/ForumThread');
const User = require('./models/User');
require('dotenv').config();

const additionalThreads = [
  { title: 'ADA compliance for signage', content: 'What are the ADA requirements for accessible signage?', tags: ['ada', 'compliance', 'regulations'], category: 'help' },
  { title: 'Custom font licensing', content: 'Tips for handling custom font licensing in sign projects', tags: ['fonts', 'licensing', 'legal'], category: 'general' },
  { title: 'Weather-resistant materials', content: 'Best materials for extreme weather conditions', tags: ['materials', 'weather', 'durability'], category: 'equipment' },
  { title: 'Project management tools', content: 'What tools do you use to manage multiple sign projects?', tags: ['project-management', 'tools', 'software'], category: 'operations' },
  { title: 'Neon sign restoration', content: 'Anyone have experience restoring vintage neon signs?', tags: ['neon', 'restoration', 'vintage'], category: 'technical' },
  { title: 'Direct mail campaigns', content: 'Has direct mail worked for your sign business?', tags: ['marketing', 'direct-mail', 'advertising'], category: 'marketing' },
  { title: 'Electrical code requirements', content: 'Understanding electrical codes for illuminated signs', tags: ['electrical', 'codes', 'regulations'], category: 'technical' },
  { title: 'Networking with contractors', content: 'How to build relationships with general contractors', tags: ['networking', 'contractors', 'business'], category: 'general' },
  { title: 'Digital menu boards', content: 'Anyone installing digital menu board systems?', tags: ['digital', 'menu-boards', 'technology'], category: 'equipment' },
  { title: 'Sign removal process', content: 'Best practices for safely removing old signs', tags: ['removal', 'installation', 'safety'], category: 'operations' },
];

const getDateForEarlier = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 23) + 8; // 8 to 30 days ago
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  return date;
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard');
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found');
      process.exit(1);
    }

    console.log(`Adding ${additionalThreads.length} more threads...`);

    const threads = additionalThreads.map((template, i) => {
      const createdAt = getDateForEarlier();
      return {
        ...template,
        author: adminUser._id,
        views: Math.floor(Math.random() * 100) + 20,
        createdAt,
        updatedAt: createdAt,
        isPinned: false,
        isLocked: false,
        likes: [],
        replies: []
      };
    });

    await ForumThread.insertMany(threads);
    console.log(`✅ Added ${threads.length} more threads!`);
    console.log('Total threads in database:', await ForumThread.countDocuments());
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
