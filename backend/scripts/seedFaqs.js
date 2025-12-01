const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const FAQ = require('../models/FAQ');

const faqsData = [
  // General / Getting Started
  {
    question: "What is Sign Company and how does it work?",
    answer: "Sign Company is a national sign franchise network that provides franchise owners with the tools, resources, and support needed to run a successful sign business. We offer comprehensive training, marketing support, preferred vendor relationships, and a proven business model without ongoing royalty fees.",
    category: "general",
    tags: ["franchise", "business model", "introduction"],
    views: 2341,
    order: 1
  },
  {
    question: "How do I access the owner portal for the first time?",
    answer: "To access the owner portal, you'll receive login credentials via email after your franchise agreement is finalized. Visit the portal URL, enter your credentials, and follow the first-time setup wizard to configure your profile and preferences. If you haven't received your credentials, contact support at support@signcompany.com.",
    category: "general",
    tags: ["portal", "login", "getting started", "credentials"],
    views: 1876,
    order: 2
  },
  {
    question: "What training resources are available for new owners?",
    answer: "New owners have access to our comprehensive training program including: 1) Initial 2-week on-site training at our headquarters, 2) Online video library with 100+ training modules, 3) Monthly webinars on various topics, 4) One-on-one mentorship program, 5) Annual convention with advanced workshops, and 6) 24/7 access to our resource library.",
    category: "general",
    tags: ["training", "onboarding", "resources", "new owners"],
    views: 1654,
    order: 3
  },

  // Technical Support
  {
    question: "How do I troubleshoot issues with my Roland printer?",
    answer: "Common Roland printer issues can be resolved by: 1) Checking ink levels and replacing if low, 2) Running the automatic cleaning cycle, 3) Verifying media is loaded correctly, 4) Updating firmware through the control panel, 5) Checking for clogged print heads. For persistent issues, contact Roland support at 1-800-542-2307 or access our video troubleshooting guides in the resource library.",
    category: "technical",
    tags: ["roland", "printer", "troubleshooting", "maintenance"],
    views: 1234,
    order: 4
  },
  {
    question: "What file formats are best for sign production?",
    answer: "For optimal quality, use vector formats like AI (Adobe Illustrator), EPS, or PDF for logos and text. For photos and complex graphics, use high-resolution (300 DPI minimum) TIFF or PNG files. Avoid JPEG for text-heavy designs as compression can cause artifacts. Always convert text to outlines and use CMYK color mode for print production.",
    category: "technical",
    tags: ["file formats", "design", "production", "quality"],
    views: 1456,
    order: 5
  },
  {
    question: "How do I calibrate my vinyl cutter for accurate cuts?",
    answer: "To calibrate your vinyl cutter: 1) Clean the cutting strip and blade holder, 2) Set the correct blade depth (blade should barely scratch the backing), 3) Adjust the cutting pressure based on material type, 4) Run a test cut with the built-in calibration pattern, 5) Fine-tune offset settings if corners aren't cutting cleanly. Refer to our equipment guides for brand-specific instructions.",
    category: "technical",
    tags: ["vinyl cutter", "calibration", "cutting", "setup"],
    views: 987,
    order: 6
  },

  // Billing / Pricing & Finance
  {
    question: "How does Sign Company's no-royalty model work?",
    answer: "Unlike traditional franchises, Sign Company charges no ongoing royalty fees. You pay a one-time franchise fee for lifetime access to our brand, training, and support systems. Your only ongoing costs are optional: attending conventions, purchasing from preferred vendors (at discounted rates), and any additional training you choose. This model allows you to keep more of your profits.",
    category: "billing",
    tags: ["royalty", "fees", "franchise model", "costs"],
    views: 3456,
    order: 7
  },
  {
    question: "What financing options are available for equipment purchases?",
    answer: "We offer several financing options through our preferred partners: 1) 0% financing for up to 60 months on select equipment, 2) Lease-to-own programs with tax benefits, 3) Bulk purchase discounts when buying multiple items, 4) Trade-in programs for upgrading equipment. Contact our equipment team for personalized financing solutions.",
    category: "billing",
    tags: ["financing", "equipment", "leasing", "payments"],
    views: 2134,
    order: 8
  },
  {
    question: "How do I access vendor discounts and preferred pricing?",
    answer: "As a Sign Company franchise owner, you automatically receive access to our preferred vendor network. Log into the owner portal, navigate to 'Vendors & Partners', and you'll find discount codes, special pricing tiers, and direct ordering links. Most discounts are applied automatically when you order through our portal. Some vendors require you to mention your Sign Company membership when ordering directly.",
    category: "billing",
    tags: ["vendors", "discounts", "pricing", "savings"],
    views: 1567,
    order: 9
  },

  // Equipment
  {
    question: "What equipment do I need to start a basic sign shop?",
    answer: "A basic sign shop requires: 1) Wide-format printer (54\" or 64\" recommended), 2) Vinyl cutter/plotter, 3) Laminator for protecting prints, 4) Computer with design software (Adobe Creative Suite or similar), 5) Basic hand tools and installation equipment, 6) Vehicle wrap station (optional but recommended). Our equipment specialists can help you build a custom package based on your budget and goals.",
    category: "equipment",
    tags: ["startup", "equipment list", "basics", "shop setup"],
    views: 2890,
    order: 10
  },
  {
    question: "How often should I service my large format printer?",
    answer: "Regular maintenance is crucial for print quality and longevity. Daily: Run nozzle check and light cleaning. Weekly: Clean print heads and capping station. Monthly: Deep clean print heads, check and clean encoder strip, inspect ink lines. Quarterly: Replace dampers and wiper blades. Annually: Professional service inspection. Keep a maintenance log to track all service activities.",
    category: "equipment",
    tags: ["maintenance", "printer", "service", "schedule"],
    views: 1678,
    order: 11
  },

  // Materials
  {
    question: "What vinyl types should I stock for vehicle wraps?",
    answer: "For professional vehicle wraps, stock these essential vinyls: 1) Cast vinyl (3M 1080, Avery Supreme) for complex curves, 2) Calendered vinyl for flat surfaces and short-term applications, 3) Reflective vinyl for emergency and commercial vehicles, 4) Perforated window film for see-through graphics, 5) Overlaminate for protection. Also keep primer, surface prep solutions, and application tools on hand.",
    category: "materials",
    tags: ["vinyl", "vehicle wraps", "materials", "inventory"],
    views: 1234,
    order: 12
  },
  {
    question: "How do I properly store vinyl and print media?",
    answer: "Proper storage extends material life and prevents quality issues: 1) Store rolls vertically or on a rack (never flat), 2) Keep in climate-controlled environment (68-77°F, 40-60% humidity), 3) Keep away from direct sunlight and heat sources, 4) Use original packaging or dust covers, 5) Rotate stock using FIFO (first in, first out), 6) Check expiration dates - most vinyl is best used within 2 years.",
    category: "materials",
    tags: ["storage", "vinyl", "media", "best practices"],
    views: 876,
    order: 13
  },

  // Operations
  {
    question: "How do I find and hire qualified sign installers?",
    answer: "Finding qualified installers: 1) Post on industry-specific job boards like SignJobs.com, 2) Network at local sign association meetings, 3) Partner with vocational schools offering sign programs, 4) Use our installer network directory, 5) Consider subcontracting initially. Always verify insurance, check references, and ensure they're certified for electrical work if needed.",
    category: "operations",
    tags: ["hiring", "installers", "employees", "staffing"],
    views: 1345,
    order: 14
  },
  {
    question: "What insurance coverage do I need for my sign business?",
    answer: "Essential insurance coverage includes: 1) General Liability ($2M minimum), 2) Professional Liability/E&O, 3) Commercial Auto with hired/non-owned coverage, 4) Workers' Compensation, 5) Equipment/Inland Marine coverage, 6) Installation Floater policy. Our preferred insurance partner offers package deals specifically designed for sign shops with competitive rates.",
    category: "operations",
    tags: ["insurance", "liability", "coverage", "protection"],
    views: 2567,
    order: 15
  },
  {
    question: "How should I price my sign products and services?",
    answer: "Effective pricing strategies: 1) Calculate true costs (materials, labor, overhead), 2) Research local market rates, 3) Use our pricing calculator tool in the portal, 4) Factor in your expertise and quality, 5) Consider value-based pricing for custom work, 6) Offer package deals for repeat customers. Aim for 40-60% gross margins on materials and 50-70% on labor. Don't undervalue your work to compete on price alone.",
    category: "operations",
    tags: ["pricing", "margins", "quotes", "business"],
    views: 3210,
    order: 16
  },

  // Training
  {
    question: "How often are new training videos added to the library?",
    answer: "We add new training content weekly, including: technique tutorials, equipment reviews, business development strategies, and case studies. All owners receive email notifications for new content in their interest areas. You can also request specific topics through the portal, and popular requests are prioritized for content creation.",
    category: "training",
    tags: ["videos", "learning", "content", "updates"],
    views: 987,
    order: 17
  },
  {
    question: "Can I download resources for offline access?",
    answer: "Yes, most resources can be downloaded for offline access. PDFs, templates, and forms are freely downloadable. Video content can be downloaded through our mobile app for offline viewing. Some proprietary content may have download restrictions but can be accessed online 24/7.",
    category: "training",
    tags: ["downloads", "offline", "mobile", "access"],
    views: 1123,
    order: 18
  },
  {
    question: "When and where is the annual convention held?",
    answer: "The annual Sign Company Convention is typically held in October at rotating locations across the country. The 3-day event includes keynote speakers, hands-on workshops, vendor exhibitions, networking events, and awards ceremony. Early bird registration opens in June. Check the Events section of the portal for dates, location, and registration details.",
    category: "training",
    tags: ["convention", "events", "networking", "annual"],
    views: 1890,
    order: 19
  },

  // Other / Legal & Compliance
  {
    question: "What permits do I need for sign installations?",
    answer: "Permit requirements vary by location but typically include: 1) Sign permit from local building/zoning department, 2) Electrical permit for illuminated signs, 3) Business license, 4) Contractor's license (may be required for certain installations). Always check local regulations before installation. Our resource library includes permit guides for major cities and a general checklist.",
    category: "other",
    tags: ["permits", "legal", "compliance", "installation"],
    views: 1654,
    order: 20
  },
  {
    question: "How do I handle copyright and trademark issues in sign design?",
    answer: "To avoid legal issues: 1) Never use copyrighted images without permission or license, 2) Verify customer has rights to logos they provide, 3) Use licensed stock images or create original artwork, 4) Be cautious with sports team logos and character designs, 5) Get written approval for any trademarked content. When in doubt, consult our legal resources or contact corporate for guidance.",
    category: "other",
    tags: ["copyright", "trademark", "legal", "design"],
    views: 1432,
    order: 21
  }
];

const seedFaqs = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');

    // Add helpful votes to simulate real data
    const faqsWithVotes = faqsData.map(faq => ({
      ...faq,
      helpful: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, () => ({
        visitorId: `visitor_${Math.random().toString(36).substring(7)}`,
        isHelpful: Math.random() > 0.15, // 85% helpful rate
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      }))
    }));

    // Insert FAQs
    const result = await FAQ.insertMany(faqsWithVotes);
    console.log(`Successfully seeded ${result.length} FAQs`);

    // Show category breakdown
    const categories = {};
    result.forEach(faq => {
      categories[faq.category] = (categories[faq.category] || 0) + 1;
    });
    console.log('\nCategory breakdown:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
};

seedFaqs();
