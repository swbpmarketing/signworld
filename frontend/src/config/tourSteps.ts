import type { Step } from 'react-joyride';

/**
 * Detailed product tour steps covering all main features
 * Each page includes specific interactive elements and their functions
 */
export const tourSteps: Step[] = [
  // Welcome
  {
    target: 'body',
    content: 'Welcome to the Sign Company Dashboard! Let\'s take a detailed tour of all features and how to use them.',
    placement: 'center',
    disableBeacon: true,
  },

  // Top bar features (shown early for context)
  {
    target: '[data-tour="search-button"]',
    content: 'Use the Global Search (Ctrl+K) to quickly find users, files, posts, or any content across the platform.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications-button"]',
    content: 'Get real-time Notifications for mentions, comments, messages, and system updates.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    content: 'Access your Profile, Settings, Accessibility options, and sign out from here.',
    placement: 'bottom',
  },

  // ============ DASHBOARD ============
  {
    target: '[data-tour="nav-dashboard"]',
    content: 'The Dashboard is your home base - see key metrics and recent activity at a glance.',
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-stats-cards"]',
    content: 'These cards show important metrics like total users, active sessions, and system health.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard-charts"]',
    content: 'Interactive charts help visualize trends in user activity, growth, and engagement over time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard-recent-activity"]',
    content: 'Stay updated with the latest activity - new users, posts, and system events appear here.',
    placement: 'bottom',
  },

  // Reports
  {
    target: '[data-tour="nav-reports"]',
    content: 'Access detailed Reports here to analyze your business performance and trends.',
    placement: 'right',
  },
  {
    target: '[data-tour="reports-content"]',
    content: 'View comprehensive reports including sales, inventory, customer analytics, and more.',
    placement: 'bottom',
  },

  // User Management (Admin only)
  {
    target: '[data-tour="nav-user-management"]',
    content: 'User Management lets you control who has access to the system and what they can do.',
    placement: 'right',
  },
  {
    target: '[data-tour="create-user-button"]',
    content: 'Click here to add new users to your system. You can create owners, vendors, or other admins.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-search"]',
    content: 'Search for users by name, email, or role to quickly find who you\'re looking for.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-filters"]',
    content: 'Filter users by role (Owner, Vendor, Admin) or account status to organize your view.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-table"]',
    content: 'This table shows all users with their details. Click on any user to view or edit their information.',
    placement: 'top',
  },
  {
    target: '[data-tour="user-actions"]',
    content: 'Use these action buttons to edit user details, change roles, suspend accounts, or delete users.',
    placement: 'left',
  },
  {
    target: '[data-tour="bulk-actions"]',
    content: 'Select multiple users to perform bulk operations like role changes or account status updates.',
    placement: 'bottom',
  },

  // Calendar
  {
    target: '[data-tour="nav-calendar"]',
    content: 'The Calendar helps you stay organized with events, deadlines, and important dates.',
    placement: 'right',
  },
  {
    target: '[data-tour="add-event-button"]',
    content: 'Click here to create a new calendar event. Add details like date, time, and attendees.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="calendar-view-switcher"]',
    content: 'Switch between Month, Week, Day, and Agenda views to see your schedule the way you prefer.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="calendar-grid"]',
    content: 'Click on any date to quickly add an event, or click an existing event to view or edit its details.',
    placement: 'top',
  },
  {
    target: '[data-tour="event-filters"]',
    content: 'Filter events by category or attendees to focus on what matters most to you.',
    placement: 'left',
  },

  // Convention
  {
    target: '[data-tour="nav-convention"]',
    content: 'Discover industry conventions, trade shows, and networking events.',
    placement: 'right',
  },
  {
    target: '[data-tour="convention-list"]',
    content: 'Browse all upcoming conventions with dates, locations, and registration details.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="register-button"]',
    content: 'Click here to register for a convention and secure your spot.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="convention-filters"]',
    content: 'Filter conventions by date, location, or type to find events that interest you.',
    placement: 'left',
  },

  // Success Stories (Brags)
  {
    target: '[data-tour="nav-brags"]',
    content: 'Success Stories is where you share wins and celebrate achievements with the community.',
    placement: 'right',
  },
  {
    target: '[data-tour="create-brag-button"]',
    content: 'Click here to share your success story. Add photos, details, and inspire others!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="category-filters"]',
    content: 'Filter stories by category like Sales, Growth, Marketing, or Innovation to find relevant content.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="brag-cards"]',
    content: 'Each card shows a success story. Click to read the full details and engage with reactions.',
    placement: 'top',
  },
  {
    target: '[data-tour="like-comment-actions"]',
    content: 'Like stories you love and leave comments to congratulate or ask questions.',
    placement: 'left',
  },
  {
    target: '[data-tour="share-brag"]',
    content: 'Share inspiring stories with your network or save them for later reference.',
    placement: 'bottom',
  },

  // Forum
  {
    target: '[data-tour="nav-forum"]',
    content: 'The Forum is where you ask questions, share knowledge, and discuss industry topics.',
    placement: 'right',
  },
  {
    target: '[data-tour="create-thread-button"]',
    content: 'Start a new discussion thread. Ask questions or share insights with the community.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="trending-tags"]',
    content: 'See what topics are trending. Click a tag to filter discussions by that topic.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="thread-list"]',
    content: 'Browse all discussion threads. Click any thread to read and join the conversation.',
    placement: 'top',
  },
  {
    target: '[data-tour="reply-button"]',
    content: 'Reply to threads to share your thoughts, answer questions, or provide helpful feedback.',
    placement: 'left',
  },
  {
    target: '[data-tour="pin-lock-thread"]',
    content: 'Moderators can pin important threads or lock discussions that are resolved or off-topic.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search-threads"]',
    content: 'Search for specific topics or keywords to find relevant discussions quickly.',
    placement: 'bottom',
  },

  // Chat
  {
    target: '[data-tour="nav-chat"]',
    content: 'Chat lets you message other members in real-time for quick collaboration.',
    placement: 'right',
  },
  {
    target: '[data-tour="new-chat-button"]',
    content: 'Start a new conversation. Search for members and send them a direct message.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="chat-list"]',
    content: 'All your conversations appear here. Click one to view and continue the discussion.',
    placement: 'right',
  },
  {
    target: '[data-tour="message-input"]',
    content: 'Type your message here. You can also attach files, images, or emoji reactions.',
    placement: 'top',
  },
  {
    target: '[data-tour="chat-search"]',
    content: 'Search within conversations to find specific messages or shared files.',
    placement: 'left',
  },

  // Library
  {
    target: '[data-tour="nav-library"]',
    content: 'The Library stores all shared files, documents, templates, and resources.',
    placement: 'right',
  },
  {
    target: '[data-tour="upload-file-button"]',
    content: 'Upload files to share with the community. Add descriptions and organize into folders.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="file-type-cards"]',
    content: 'Filter files by type (PDFs, Images, Documents, Spreadsheets) for easier browsing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="folder-navigation"]',
    content: 'Navigate through folders to organize and find files more efficiently.',
    placement: 'left',
  },
  {
    target: '[data-tour="file-grid"]',
    content: 'All files are displayed here. Click any file to preview, download, or share it.',
    placement: 'top',
  },
  {
    target: '[data-tour="file-actions"]',
    content: 'Use these options to download, share, rename, move, or delete files.',
    placement: 'left',
  },
  {
    target: '[data-tour="search-files"]',
    content: 'Search for files by name, type, or uploader to quickly find what you need.',
    placement: 'bottom',
  },

  // Owners Roster
  {
    target: '[data-tour="nav-owners"]',
    content: 'The Owners Roster helps you connect with other sign company owners nationwide.',
    placement: 'right',
  },
  {
    target: '[data-tour="owner-search"]',
    content: 'Search for owners by name, company, location, or specialty to find the right connections.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="owner-filters"]',
    content: 'Filter by state, city, or business size to narrow down your search results.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="owner-cards"]',
    content: 'Each card shows an owner\'s profile. Click to view full details and contact information.',
    placement: 'top',
  },
  {
    target: '[data-tour="contact-owner"]',
    content: 'Send a message, view their location, or connect via phone or email.',
    placement: 'left',
  },
  {
    target: '[data-tour="export-owners"]',
    content: 'Export the roster to CSV for your records or offline reference.',
    placement: 'bottom',
  },

  // Map Search
  {
    target: '[data-tour="nav-map"]',
    content: 'Map Search displays owners and vendors geographically for easy location-based discovery.',
    placement: 'right',
  },
  {
    target: '[data-tour="map-canvas"]',
    content: 'The interactive map shows all members. Click any marker to view their details.',
    placement: 'top',
  },
  {
    target: '[data-tour="map-search-input"]',
    content: 'Search for a specific location or address to jump to that area on the map.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="map-filters"]',
    content: 'Filter by member type (Owners, Vendors) or specialty to refine what you see on the map.',
    placement: 'left',
  },
  {
    target: '[data-tour="map-markers"]',
    content: 'Each marker represents a business. Click to see contact info and send messages.',
    placement: 'top',
  },

  // Partners
  {
    target: '[data-tour="nav-partners"]',
    content: 'Partners offers exclusive deals and discounts from trusted industry vendors.',
    placement: 'right',
  },
  {
    target: '[data-tour="partner-categories"]',
    content: 'Browse partners by category like Suppliers, Software, Insurance, or Marketing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="partner-cards"]',
    content: 'Each card shows a partner with their offers. Click to learn more about benefits.',
    placement: 'top',
  },
  {
    target: '[data-tour="claim-offer"]',
    content: 'Click here to claim a partner offer or get the discount code for members.',
    placement: 'left',
  },
  {
    target: '[data-tour="partner-ratings"]',
    content: 'See ratings and reviews from other members to make informed decisions.',
    placement: 'bottom',
  },

  // Videos
  {
    target: '[data-tour="nav-videos"]',
    content: 'Videos provides training content, webinars, and industry insights to help you learn.',
    placement: 'right',
  },
  {
    target: '[data-tour="upload-video-button"]',
    content: 'Upload your own training videos or tutorials to share knowledge with the community.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="video-categories"]',
    content: 'Filter videos by category like Training, Marketing, Operations, or Technology.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="video-grid"]',
    content: 'Browse all videos with thumbnails and descriptions. Click any video to watch.',
    placement: 'top',
  },
  {
    target: '[data-tour="video-playlists"]',
    content: 'Create playlists to organize videos by topic for easier access and learning paths.',
    placement: 'left',
  },
  {
    target: '[data-tour="video-reactions"]',
    content: 'Like videos and leave comments to engage with content creators.',
    placement: 'bottom',
  },

  // Equipment
  {
    target: '[data-tour="nav-equipment"]',
    content: 'Equipment is a marketplace for buying and selling sign-making tools and machinery.',
    placement: 'right',
  },
  {
    target: '[data-tour="equipment-search"]',
    content: 'Search for specific equipment by name, type, brand, or condition.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="equipment-filters"]',
    content: 'Filter by category, price range, location, or condition to find what you need.',
    placement: 'left',
  },
  {
    target: '[data-tour="equipment-listings"]',
    content: 'Browse all available equipment. Click any listing to view full details and photos.',
    placement: 'top',
  },
  {
    target: '[data-tour="inquire-button"]',
    content: 'Send an inquiry to the seller to ask questions or make an offer.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="save-listing"]',
    content: 'Save listings to your favorites to review later or compare options.',
    placement: 'left',
  },

  // Vendor-specific: My Listings
  {
    target: '[data-tour="nav-vendor-equipment"]',
    content: 'Vendors: This is where you manage all your equipment listings.',
    placement: 'right',
  },
  {
    target: '[data-tour="add-listing-button"]',
    content: 'Add a new equipment listing with photos, description, price, and specifications.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="vendor-listings-table"]',
    content: 'View all your active listings. Track views, inquiries, and listing performance.',
    placement: 'top',
  },
  {
    target: '[data-tour="edit-listing"]',
    content: 'Edit listing details, update pricing, or mark items as sold.',
    placement: 'left',
  },
  {
    target: '[data-tour="listing-analytics"]',
    content: 'See how many views and inquiries each listing has received.',
    placement: 'bottom',
  },

  // Vendor-specific: My Inquiries
  {
    target: '[data-tour="nav-vendor-inquiries"]',
    content: 'Vendors: Manage all customer inquiries about your equipment here.',
    placement: 'right',
  },
  {
    target: '[data-tour="inquiry-list"]',
    content: 'All inquiries from potential buyers are listed here with their contact details.',
    placement: 'top',
  },
  {
    target: '[data-tour="reply-inquiry"]',
    content: 'Reply to inquiries directly or mark them as contacted to stay organized.',
    placement: 'left',
  },
  {
    target: '[data-tour="inquiry-filters"]',
    content: 'Filter by status (New, Contacted, Closed) to manage your sales pipeline.',
    placement: 'bottom',
  },

  // Vendor-specific: Business Profile
  {
    target: '[data-tour="nav-vendor-profile"]',
    content: 'Vendors: Your Business Profile showcases your company to potential buyers.',
    placement: 'right',
  },
  {
    target: '[data-tour="edit-profile-button"]',
    content: 'Update your company information, logo, and business description.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-sections"]',
    content: 'Add details like services offered, specialties, certifications, and contact info.',
    placement: 'top',
  },
  {
    target: '[data-tour="profile-photos"]',
    content: 'Upload photos of your products, facility, or team to build credibility.',
    placement: 'left',
  },

  // FAQs
  {
    target: '[data-tour="nav-faqs"]',
    content: 'FAQs provides answers to common questions and helpful resources.',
    placement: 'right',
  },
  {
    target: '[data-tour="faq-search"]',
    content: 'Search the knowledge base for specific topics or keywords to find quick answers.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="faq-categories"]',
    content: 'Browse FAQs by category like Account, Billing, Features, or Technical Support.',
    placement: 'left',
  },
  {
    target: '[data-tour="faq-list"]',
    content: 'Click any question to expand and read the full answer with helpful details.',
    placement: 'top',
  },
  {
    target: '[data-tour="contact-support"]',
    content: 'Can\'t find your answer? Contact support directly for personalized help.',
    placement: 'bottom',
  },

  // Bug Reports
  {
    target: '[data-tour="nav-bug-reports"]',
    content: 'Bug Reports lets you report issues and track fixes to improve the platform.',
    placement: 'right',
  },
  {
    target: '[data-tour="report-bug-button"]',
    content: 'Click here to submit a new bug report. Include details, screenshots, and steps to reproduce.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="bug-status-columns"]',
    content: 'Reports are organized by status: Pending, In Progress, Resolved, or Closed.',
    placement: 'top',
  },
  {
    target: '[data-tour="bug-card"]',
    content: 'Click any bug report to view details, add comments, or track progress.',
    placement: 'left',
  },
  {
    target: '[data-tour="bug-filters"]',
    content: 'Filter by priority, category, or status to find specific reports.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-reports"]',
    content: 'View all your submitted reports and their current status.',
    placement: 'right',
  },

  // Final step
  {
    target: 'body',
    content: 'You\'re all set! You can restart this tour anytime from the Settings page. Enjoy exploring the platform!',
    placement: 'center',
  },
];

/**
 * Get filtered steps based on user role
 * Some features are role-specific and should only appear for certain users
 */
export const getFilteredSteps = (userRole?: string): Step[] => {
  if (!userRole) return tourSteps;

  return tourSteps.filter((step) => {
    const target = step.target as string;

    // Admin-only steps
    if (target.includes('user-management') && userRole !== 'admin') {
      return false;
    }

    // Vendor-only steps
    if (
      (target.includes('vendor-equipment') ||
       target.includes('vendor-inquiries') ||
       target.includes('vendor-profile')) &&
      userRole !== 'vendor' &&
      userRole !== 'admin'
    ) {
      return false;
    }

    // Forum is not available to vendors
    if (target.includes('nav-forum') && userRole === 'vendor') {
      return false;
    }

    // Owners Roster is not available to vendors
    if (target.includes('nav-owners') && userRole === 'vendor') {
      return false;
    }

    // Videos is not available to vendors
    if (target.includes('nav-videos') && userRole === 'vendor') {
      return false;
    }

    return true;
  });
};
