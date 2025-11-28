const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Brag = require('../models/Brag');
const User = require('../models/User');
const connectDB = require('../config/db');

const sampleBrags = [
  {
    title: 'Increased Monthly Revenue by 45% with New Signage Strategy',
    content: `I wanted to share a success story that might help others in our community!

Last quarter, we completely revamped our approach to retail signage and the results have been incredible.

**The Challenge:**
Our traditional signage business was plateauing. We were doing the same types of jobs and struggling to grow beyond our existing client base.

**What We Changed:**
1. Started offering digital signage solutions alongside traditional signs
2. Created package deals for small businesses (storefront + vehicle wrap + business cards)
3. Implemented a referral program with 10% commission
4. Started showcasing our work on social media consistently

**The Results:**
- 45% increase in monthly revenue
- 12 new recurring clients
- Average job value increased from $800 to $1,400
- Customer retention improved by 30%

The biggest game-changer was the package deals. Small business owners loved getting everything in one place, and it increased our average ticket significantly.

Happy to answer any questions about our approach!`,
    tags: ['sales', 'growth', 'marketing'],
    views: 1247,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'How We Cut Production Time in Half with Better Workflow',
    content: `After struggling with long turnaround times for years, we finally cracked the code on efficiency!

**Our Old Process:**
- Jobs would sit in queue for days
- Multiple handoffs between team members
- Constant searching for files and materials
- Rush jobs threw everything off

**The New System:**
We implemented a simple Kanban board system (we use Trello, but a whiteboard works too):

1. **Incoming** - New orders land here
2. **Design Review** - Customer approval stage
3. **Production Ready** - Approved and materials confirmed
4. **In Progress** - Currently being produced
5. **Quality Check** - Final inspection
6. **Ready for Pickup/Delivery**

**Key Changes:**
- Color-coded labels for job types (vehicle wraps = blue, banners = green, etc.)
- Daily 15-minute standup meetings
- Dedicated "rush job" lane with premium pricing
- Pre-cut vinyl inventory for common colors

**Results After 3 Months:**
- Average turnaround: 5 days → 2.5 days
- Rush job capacity: 2/week → 5/week
- Customer complaints about delays: Down 80%
- Team stress levels: Significantly lower!

The best part? Our customers now refer us specifically because of our fast turnaround. It's become a competitive advantage.`,
    tags: ['operations', 'growth'],
    views: 892,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'From Zero to 50 Vehicle Wraps in One Year',
    content: `When I started focusing on vehicle wraps a year ago, I had never done one. Today, we've completed over 50 wraps and it's now 40% of our revenue!

**How It Started:**
A customer asked if we could wrap their work van. I said yes (even though I'd never done it) and spent a weekend learning from YouTube videos and wrap forums.

**The First Wrap:**
Not gonna lie - it took me 16 hours and wasn't perfect. But the customer was happy, and I learned SO much.

**Building the Business:**
1. **Invested in training** - Took an Avery certification course ($500, worth every penny)
2. **Started small** - Partial wraps and spot graphics to build skills
3. **Built a portfolio** - Offered discounts to friends/family for photo rights
4. **Targeted fleet accounts** - Reached out to local contractors, plumbers, electricians
5. **Created wrap-specific content** - Before/after photos, time-lapse videos

**The Numbers:**
- Year 1: 50 complete wraps
- Average job value: $2,800
- Fleet accounts: 4 (recurring work!)
- Referral rate: 60% of new customers

**Tips for Getting Started:**
- Start with easier vehicles (vans, trucks with flat panels)
- Invest in quality tools (squeegees, heat gun, knifeless tape)
- Don't underprice - charge what it's worth
- Document everything for your portfolio

Vehicle wraps changed my business. If you're considering adding this service, DO IT!`,
    tags: ['sales', 'growth'],
    views: 2156,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'Customer Service Turnaround: From 3-Star to 5-Star Reviews',
    content: `Six months ago, our Google rating was 3.2 stars. Today, we're at 4.8 stars with over 100 reviews. Here's exactly what we did.

**The Wake-Up Call:**
A brutally honest 1-star review made me realize we had a customer service problem. The reviewer wasn't wrong - we had dropped the ball.

**Step 1: Response Protocol**
- Reply to EVERY review within 24 hours
- For negative reviews: apologize, take it offline, make it right
- For positive reviews: thank them specifically for what they mentioned

**Step 2: Communication Overhaul**
- Automated order confirmation emails
- Progress updates at key milestones
- "Your order is ready" text messages
- Follow-up call 1 week after delivery

**Step 3: Quality Checkpoints**
- Design approval before production (no assumptions!)
- Photo of completed work before customer pickup
- Quality checklist for every job

**Step 4: Make It Right Policy**
If something isn't perfect, we fix it immediately - no questions asked. This has cost us maybe $500 total but earned us countless referrals.

**Step 5: Ask for Reviews**
- Printed cards with QR code to Google reviews
- Follow-up email with review request
- Small discount on next order for leaving a review

**The Results:**
- Rating: 3.2 → 4.8 stars
- Reviews: 23 → 107
- Repeat customers: Up 45%
- Referrals: Up 60%

Good reviews are marketing that pays for itself!`,
    tags: ['customer-service', 'marketing'],
    views: 1534,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'Built a $10K/Month Recurring Revenue Stream',
    content: `I've finally achieved the holy grail of sign business: predictable recurring revenue! Here's how we built a $10K/month maintenance program.

**The Opportunity:**
I noticed we kept getting calls from past customers - lights burned out, signs faded, damage from storms. Each was a one-off job that required scheduling, quoting, etc.

**The Solution: Maintenance Agreements**

**What We Offer:**
- Monthly inspection visits
- Cleaning and touch-ups included
- Priority repair response
- Discounted rates on replacements
- Annual refresh (new faces, updated graphics)

**Pricing Tiers:**
1. **Basic** ($150/mo) - 1 sign, quarterly visits
2. **Standard** ($350/mo) - Up to 5 signs, monthly visits
3. **Premium** ($750/mo) - Unlimited signs, bi-weekly visits + emergency response

**How We Sold It:**
- Started with our best existing customers
- Showed them the math: reactive repairs cost more than prevention
- Offered first month free to try it out
- Emphasized peace of mind and professional appearance

**Current Stats:**
- 22 maintenance clients
- $10,400 monthly recurring revenue
- Average client tenure: 14 months
- Churn rate: Less than 5%

**The Hidden Benefits:**
- Predictable cash flow for planning
- Regular touchpoints lead to upsells
- Clients are locked in (won't go to competitors)
- Less stressful than chasing new jobs

This has completely transformed our business stability!`,
    tags: ['sales', 'growth', 'operations'],
    views: 1876,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'How Social Media Doubled Our Leads in 90 Days',
    content: `I was skeptical about social media for a "boring" business like signs. Boy, was I wrong!

**Before:**
- Posted once a month (maybe)
- Random photos with no strategy
- 200 followers after 3 years
- Zero leads from social media

**The 90-Day Experiment:**

**Week 1-2: Research**
- Followed successful sign shops
- Noted what content got engagement
- Identified our target audience (local business owners)

**Week 3-4: Content Creation**
- Batch-created 30 days of content
- Mix of: before/after, process videos, tips, customer spotlights
- Used Canva for professional-looking graphics

**Posting Schedule:**
- Instagram: 5x/week
- Facebook: 3x/week
- Google Business: 2x/week
- LinkedIn: 1x/week (B2B focus)

**Content That Worked Best:**
1. Time-lapse installation videos (most shares)
2. Before/after transformations (most saves)
3. "Day in the life" stories (most engagement)
4. Customer testimonials (most leads)
5. Tips for business owners (most followers)

**The Results After 90 Days:**
- Followers: 200 → 2,400
- Monthly reach: 500 → 45,000
- DM inquiries: 0 → 8-12/week
- Leads attributed to social: 34
- Closed deals from social: 11 ($28K revenue)

**What I Learned:**
- Consistency beats perfection
- People love seeing the process
- Local hashtags are gold
- Engage with other local businesses
- Track everything!

If you're not on social media, you're leaving money on the table.`,
    tags: ['marketing', 'growth'],
    views: 2341,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'Giving Back: Our Community Signage Program',
    content: `This isn't about profit - it's about purpose. I wanted to share our community giveback program that's become one of the most fulfilling parts of our business.

**How It Started:**
A local youth sports league asked if we could donate some banners. We said yes, and something clicked - this felt GOOD.

**The Program:**
Each quarter, we donate signage services to one local nonprofit or community organization.

**Recipients So Far:**
- Little League baseball (scoreboard + sponsor banners)
- Local food bank (building signage + vehicle wrap)
- Animal rescue (adoption event signage)
- High school booster club (stadium banners)
- Community garden (wayfinding signs)

**How We Choose:**
- Applications through our website
- Priority to organizations without marketing budgets
- Focus on causes that impact kids and families
- Must be local to our community

**The Unexpected Benefits:**
- Amazing PR and word-of-mouth
- Team morale boost (everyone loves these projects)
- Network expansion (board members become clients)
- Tax benefits
- Great portfolio pieces

**How to Start Your Own Program:**
1. Set a budget (we allocate 2% of revenue)
2. Create simple application process
3. Announce it on social media
4. Document and share the impact

This program has added so much meaning to our work. It's not just about signs - it's about making our community better.

Who else does community giveback? Would love to hear your stories!`,
    tags: ['community', 'other'],
    views: 987,
    isPublished: true,
    status: 'approved',
  },
  {
    title: 'Landed Our First National Account: Lessons Learned',
    content: `After 5 years of local-only work, we just signed our first national account - a franchise with 47 locations! Here's how it happened and what I learned.

**The Opportunity:**
A regional manager for a fast-food franchise reached out. They needed consistent signage across all their locations in our state and neighboring states.

**The Pitch:**
I almost didn't respond - seemed too big for us. But I put together a proposal anyway:

1. **Capability deck** showing our best work
2. **Quality assurance process** documentation
3. **Scalability plan** (partnership with other sign shops)
4. **Pricing structure** with volume discounts
5. **Timeline guarantees** with penalties

**What Sealed the Deal:**
- Our detailed project management approach
- References from similar (smaller) multi-location jobs
- Willingness to invest in their specific templates
- In-person presentation to their leadership team

**The Contract:**
- 47 locations
- Exterior signage refresh
- Interior menu boards
- Window graphics
- Total value: $380,000 over 18 months

**Challenges We Faced:**
- Cash flow (had to negotiate payment terms)
- Capacity (hired 2 new installers)
- Coordination (installations across 3 states)
- Consistency (created detailed install guides)

**Key Lessons:**
1. Don't self-select out of opportunities
2. Partnerships extend your reach
3. Documentation and processes matter at scale
4. National accounts need hand-holding
5. The second national account is easier (we're pitching 3 more!)

This single account doubled our annual revenue. Don't be afraid to think bigger!`,
    tags: ['sales', 'growth'],
    views: 1654,
    isPublished: true,
    status: 'approved',
  },
];

const seedBrags = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find a user to be the author (preferably admin)
    let author = await User.findOne({ role: 'admin' });
    if (!author) {
      author = await User.findOne();
    }

    if (!author) {
      console.log('No users found in database. Please create a user first.');
      process.exit(1);
    }

    console.log(`Using author: ${author.name} (${author.email})`);

    // Clear existing brags (optional - comment out if you want to keep existing)
    await Brag.deleteMany({});
    console.log('Cleared existing brags');

    // Create brags with the author
    const bragsWithAuthor = sampleBrags.map((brag, index) => ({
      ...brag,
      author: author._id,
      likes: [],
      comments: [],
      publishedAt: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)), // Stagger dates
      createdAt: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)),
      moderatedBy: author._id,
      moderatedAt: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)),
    }));

    const createdBrags = await Brag.insertMany(bragsWithAuthor);
    console.log(`Created ${createdBrags.length} success stories`);

    console.log('\nSeeded Success Stories:');
    createdBrags.forEach((brag, i) => {
      console.log(`  ${i + 1}. ${brag.title}`);
    });

    console.log('\nSuccess! Brags seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding brags:', error);
    process.exit(1);
  }
};

seedBrags();
