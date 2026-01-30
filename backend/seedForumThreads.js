const mongoose = require('mongoose');
const ForumThread = require('./models/ForumThread');
const User = require('./models/User');
require('dotenv').config();

const forumCategories = ['general', 'technical', 'marketing', 'operations', 'equipment', 'suppliers', 'help', 'announcements'];

const threadTemplates = [
  { title: 'Best practices for sign installation', content: 'What are your go-to techniques for installing large outdoor signs?', tags: ['installation', 'outdoor', 'best-practices'] },
  { title: 'Recommended vinyl suppliers', content: 'Looking for reliable vinyl suppliers with good pricing. Any recommendations?', tags: ['suppliers', 'vinyl', 'materials'] },
  { title: 'Digital printing vs screen printing', content: 'What are the pros and cons of each method for your business?', tags: ['printing', 'equipment', 'technology'] },
  { title: 'Marketing strategies that work', content: 'Share your most effective marketing strategies for sign companies', tags: ['marketing', 'growth', 'strategy'] },
  { title: 'LED sign maintenance tips', content: 'How do you maintain and troubleshoot LED signs?', tags: ['led', 'maintenance', 'troubleshooting'] },
  { title: 'Pricing strategy discussion', content: 'How do you price your sign projects? Per square foot or project-based?', tags: ['pricing', 'business', 'strategy'] },
  { title: 'Vehicle wrap techniques', content: 'Looking for advice on complex vehicle wrap installations', tags: ['wraps', 'vehicles', 'installation'] },
  { title: 'Permitting process questions', content: 'What\'s your experience with sign permitting in different cities?', tags: ['permits', 'regulations', 'legal'] },
  { title: 'Software recommendations', content: 'What design and project management software do you use?', tags: ['software', 'tools', 'design'] },
  { title: 'Trade show experiences', content: 'Which sign industry trade shows are worth attending?', tags: ['trade-shows', 'networking', 'events'] },
  { title: 'Customer communication tips', content: 'How do you handle difficult client requests and revisions?', tags: ['clients', 'communication', 'management'] },
  { title: 'Safety equipment essentials', content: 'What safety gear is essential for your team?', tags: ['safety', 'equipment', 'team'] },
  { title: 'Subcontracting vs in-house', content: 'Do you subcontract installations or keep everything in-house?', tags: ['business', 'operations', 'strategy'] },
  { title: 'Material storage best practices', content: 'How do you organize and store your vinyl and materials?', tags: ['storage', 'organization', 'materials'] },
  { title: 'Emergency rush orders', content: 'How do you handle last-minute rush orders?', tags: ['operations', 'urgent', 'management'] },
  { title: 'Energy efficient signage', content: 'What are the benefits of LED vs traditional lighting?', tags: ['led', 'energy', 'efficiency'] },
  { title: 'Warranty policies', content: 'What warranty do you offer on your sign installations?', tags: ['warranty', 'policy', 'business'] },
  { title: 'Crane rental tips', content: 'Best practices for renting and working with cranes for large installs', tags: ['crane', 'installation', 'equipment'] },
  { title: 'Color matching challenges', content: 'Tips for achieving perfect color matches in sign production', tags: ['color', 'design', 'production'] },
  { title: 'Insurance requirements', content: 'What insurance coverage do you carry for your sign business?', tags: ['insurance', 'business', 'legal'] },
  { title: 'Training new installers', content: 'How do you train new team members on sign installation?', tags: ['training', 'team', 'installation'] },
  { title: 'Seasonal business fluctuations', content: 'How do you manage slow seasons in the sign industry?', tags: ['business', 'seasonal', 'strategy'] },
  { title: 'Monument sign foundations', content: 'Foundation requirements for monument signs - concrete specs?', tags: ['monument', 'foundation', 'installation'] },
  { title: 'Channel letter fabrication', content: 'Share your channel letter fabrication process and tips', tags: ['channel-letters', 'fabrication', 'led'] },
  { title: 'Quote follow-up strategies', content: 'How do you follow up on quotes to close more deals?', tags: ['sales', 'quotes', 'strategy'] },
];

const getRandomCategory = () => forumCategories[Math.floor(Math.random() * forumCategories.length)];
const getRandomTemplate = () => threadTemplates[Math.floor(Math.random() * threadTemplates.length)];
const getRandomViews = () => Math.floor(Math.random() * 150) + 10;

// Generate dates for different categories
const getDateForCategory = (category) => {
  const now = new Date();

  switch(category) {
    case 'today':
      // Today - random time within today
      const todayDate = new Date(now);
      todayDate.setHours(Math.floor(Math.random() * 24));
      todayDate.setMinutes(Math.floor(Math.random() * 60));
      return todayDate;

    case 'yesterday':
      // Yesterday - random time
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      yesterdayDate.setHours(Math.floor(Math.random() * 24));
      yesterdayDate.setMinutes(Math.floor(Math.random() * 60));
      return yesterdayDate;

    case 'thisWeek':
      // 2-6 days ago (this week)
      const daysAgo = Math.floor(Math.random() * 5) + 2; // 2 to 6 days ago
      const thisWeekDate = new Date(now);
      thisWeekDate.setDate(thisWeekDate.getDate() - daysAgo);
      thisWeekDate.setHours(Math.floor(Math.random() * 24));
      return thisWeekDate;

    case 'earlier':
      // 8-30 days ago (earlier)
      const weeksAgo = Math.floor(Math.random() * 23) + 8; // 8 to 30 days ago
      const earlierDate = new Date(now);
      earlierDate.setDate(earlierDate.getDate() - weeksAgo);
      earlierDate.setHours(Math.floor(Math.random() * 24));
      return earlierDate;

    default:
      return now;
  }
};

const seedForumThreads = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard');
    console.log('Connected to MongoDB');

    // Get admin user to use as author
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.name} (${adminUser.email})`);

    // Clear existing threads (optional - comment out if you want to keep existing)
    console.log('Clearing existing forum threads...');
    await ForumThread.deleteMany({});
    console.log('Existing threads cleared');

    const threads = [];

    // Create threads for each date category
    const dateCategories = ['today', 'today', 'today', 'yesterday', 'yesterday', 'thisWeek', 'thisWeek', 'thisWeek', 'thisWeek', 'earlier', 'earlier', 'earlier', 'earlier', 'earlier', 'earlier'];

    console.log(`Creating ${dateCategories.length} forum threads...`);

    for (let i = 0; i < dateCategories.length; i++) {
      const template = getRandomTemplate();
      const dateCategory = dateCategories[i];
      const createdAt = getDateForCategory(dateCategory);

      const thread = {
        title: template.title,
        content: template.content,
        author: adminUser._id,
        category: getRandomCategory(),
        tags: template.tags,
        views: getRandomViews(),
        createdAt: createdAt,
        updatedAt: createdAt,
        isPinned: false,
        isLocked: false,
        likes: [],
        replies: []
      };

      threads.push(thread);
      console.log(`  ${i + 1}. ${template.title} (${dateCategory} - ${createdAt.toLocaleDateString()})`);
    }

    // Sort threads by date (newest first) before inserting
    threads.sort((a, b) => b.createdAt - a.createdAt);

    // Insert all threads
    const insertedThreads = await ForumThread.insertMany(threads);

    console.log(`\n✅ Successfully created ${insertedThreads.length} forum threads!`);
    console.log('\nDate distribution:');
    console.log(`  - Today: 3 threads`);
    console.log(`  - Yesterday: 2 threads`);
    console.log(`  - This Week: 4 threads`);
    console.log(`  - Earlier: 6 threads`);
    console.log('\nYou should now see date separators when viewing the forum!');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding forum threads:', error);
    process.exit(1);
  }
};

seedForumThreads();
