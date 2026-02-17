import type { Step } from 'react-joyride';

export type PageTourKey =
  | 'welcome'
  | 'dashboard'
  | 'reports'
  | 'user-management'
  | 'calendar'
  | 'convention'
  | 'brags'
  | 'forum'
  | 'chat'
  | 'library'
  | 'owners'
  | 'map'
  | 'partners'
  | 'videos'
  | 'equipment'
  | 'vendor-equipment'
  | 'vendor-inquiries'
  | 'vendor-profile'
  | 'faqs'
  | 'bug-reports';

export interface PageTourConfig {
  label: string;
  description: string;
  icon: string;
  route: string;
  roles: string[];
  steps: Step[];
}

export const pageTours: Record<PageTourKey, PageTourConfig> = {
  welcome: {
    label: 'Welcome',
    description: 'Get oriented with the platform basics',
    icon: 'SparklesIcon',
    route: '/dashboard',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: 'body',
        content: 'Welcome to the Sign Company Dashboard! Let\'s get you oriented with the basics.',
        placement: 'center',
        disableBeacon: true,
        disableOverlay: true,
      },
      {
        target: '[data-tour="search-button"]',
        content: 'Use Global Search (Ctrl+K) to quickly find users, files, posts, or any content across the platform.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="notifications-button"]',
        content: 'Get real-time notifications for mentions, comments, messages, and system updates.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="user-menu"]',
        content: 'Access your Profile, Settings, Accessibility options, and sign out from here.',
        placement: 'bottom',
      },
      {
        target: 'body',
        content: 'You\'re all set! You can start page-specific tours anytime from your Profile Settings.',
        placement: 'center',
        disableOverlay: true,
      },
    ],
  },

  dashboard: {
    label: 'Dashboard',
    description: 'Your home base with key metrics',
    icon: 'HomeIcon',
    route: '/dashboard',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-dashboard"]',
        content: 'The Dashboard is your home base — see key metrics and recent activity at a glance.',
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard-stats-cards"]',
        content: 'These cards show important metrics like total users, active sessions, and system health.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-recent-activity"]',
        content: 'Stay updated with the latest activity — new users, posts, and system events appear here.',
        placement: 'bottom',
      },
    ],
  },

  reports: {
    label: 'Reports',
    description: 'Analyze business performance and trends',
    icon: 'ChartBarIcon',
    route: '/reports',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
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
    ],
  },

  'user-management': {
    label: 'User Management',
    description: 'Control user access and roles',
    icon: 'UsersIcon',
    route: '/users',
    roles: ['admin'],
    steps: [
      {
        target: '[data-tour="nav-user-management"]',
        content: 'User Management lets you control who has access to the system and what they can do.',
        placement: 'right',
      },
      {
        target: '[data-tour="create-user-button"]',
        content: 'Click here to add new users. You can create owners, vendors, or other admins.',
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
        content: 'Use these action buttons to edit user details, change roles, or manage accounts.',
        placement: 'left',
      },
      {
        target: '[data-tour="bulk-actions"]',
        content: 'Select multiple users to perform bulk operations like role changes or status updates.',
        placement: 'bottom',
      },
    ],
  },

  calendar: {
    label: 'Calendar',
    description: 'Stay organized with events and deadlines',
    icon: 'CalendarIcon',
    route: '/calendar',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
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
    ],
  },

  convention: {
    label: 'Convention',
    description: 'Industry events and trade shows',
    icon: 'BuildingOffice2Icon',
    route: '/convention',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-convention"]',
        content: 'Discover industry conventions, trade shows, and networking events.',
        placement: 'right',
      },
      {
        target: '[data-tour="convention-content"]',
        content: 'Browse all upcoming conventions with dates, locations, and registration details.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="convention-schedule"]',
        content: 'View the full event schedule to plan which sessions to attend.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="convention-register"]',
        content: 'Register for a convention and secure your spot.',
        placement: 'bottom',
      },
    ],
  },

  brags: {
    label: 'Success Stories',
    description: 'Share wins and celebrate achievements',
    icon: 'NewspaperIcon',
    route: '/brags',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
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
        content: 'Filter stories by category like Sales, Growth, Marketing, or Innovation.',
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
    ],
  },

  forum: {
    label: 'Forum',
    description: 'Discuss topics and share knowledge',
    icon: 'ChatBubbleLeftRightIcon',
    route: '/forum',
    roles: ['admin', 'owner'],
    steps: [
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
        target: '[data-tour="search-threads"]',
        content: 'Search for specific topics or keywords to find relevant discussions quickly.',
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
    ],
  },

  chat: {
    label: 'Chat',
    description: 'Real-time messaging and collaboration',
    icon: 'ChatBubbleLeftIcon',
    route: '/chat',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-chat"]',
        content: 'Chat lets you message other members in real-time for quick collaboration.',
        placement: 'right',
      },
      {
        target: '[data-tour="chat-search"]',
        content: 'Search within conversations to find specific messages or contacts.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chat-conversations"]',
        content: 'All your conversations appear here. Click one to view and continue the discussion.',
        placement: 'right',
      },
      {
        target: '[data-tour="chat-input"]',
        content: 'Type your message here to send it to the conversation.',
        placement: 'top',
      },
    ],
  },

  library: {
    label: 'Library',
    description: 'Shared files, documents, and resources',
    icon: 'FolderIcon',
    route: '/library',
    roles: ['admin', 'owner'],
    steps: [
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
        target: '[data-tour="search-files"]',
        content: 'Search for files by name, type, or uploader to quickly find what you need.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="file-grid"]',
        content: 'All files are displayed here. Click any file to preview, download, or share it.',
        placement: 'top',
      },
    ],
  },

  owners: {
    label: 'Owners Roster',
    description: 'Connect with sign company owners',
    icon: 'UserGroupIcon',
    route: '/owners',
    roles: ['admin', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-owners"]',
        content: 'The Owners Roster helps you connect with sign company owners nationwide.',
        placement: 'right',
      },
      {
        target: '[data-tour="owner-search"]',
        content: 'Search for owners by name, company, location, or specialty.',
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
    ],
  },

  map: {
    label: 'Map Search',
    description: 'Location-based member discovery',
    icon: 'MapIcon',
    route: '/map',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-map"]',
        content: 'Map Search displays owners and vendors geographically for easy location-based discovery.',
        placement: 'right',
      },
      {
        target: '[data-tour="map-search"]',
        content: 'Search for a specific location or address to jump to that area on the map.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="map-filters"]',
        content: 'Filter by member type (Owners, Vendors) or specialty to refine what you see on the map.',
        placement: 'left',
      },
      {
        target: '[data-tour="map-view"]',
        content: 'The interactive map shows all members. Click any marker to view their details.',
        placement: 'top',
      },
    ],
  },

  partners: {
    label: 'Partners',
    description: 'Exclusive deals from trusted vendors',
    icon: 'UserGroupIcon',
    route: '/partners',
    roles: ['admin', 'owner'],
    steps: [
      {
        target: '[data-tour="nav-partners"]',
        content: 'Partners offers exclusive deals and discounts from trusted industry vendors.',
        placement: 'right',
      },
      {
        target: '[data-tour="partner-search"]',
        content: 'Search for partners by name or service to find the right vendor.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="partner-categories"]',
        content: 'Browse partners by category like Suppliers, Software, Insurance, or Marketing.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="partner-grid"]',
        content: 'Each card shows a partner with their offers. Click to learn more about benefits.',
        placement: 'top',
      },
    ],
  },

  videos: {
    label: 'Videos',
    description: 'Training content and industry insights',
    icon: 'VideoCameraIcon',
    route: '/videos',
    roles: ['admin', 'owner'],
    steps: [
      {
        target: '[data-tour="nav-videos"]',
        content: 'Videos provides training content, webinars, and industry insights to help you learn.',
        placement: 'right',
      },
      {
        target: '[data-tour="video-search"]',
        content: 'Search for videos by title, topic, or presenter.',
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
    ],
  },

  equipment: {
    label: 'Equipment',
    description: 'Marketplace for sign-making tools',
    icon: 'ShoppingBagIcon',
    route: '/equipment',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
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
        target: '[data-tour="equipment-grid"]',
        content: 'Browse all available equipment. Click any listing to view full details and photos.',
        placement: 'top',
      },
    ],
  },

  'vendor-equipment': {
    label: 'My Listings',
    description: 'Manage your equipment listings',
    icon: 'ClipboardDocumentListIcon',
    route: '/vendor-equipment',
    roles: ['vendor'],
    steps: [
      {
        target: '[data-tour="nav-vendor-equipment"]',
        content: 'This is where you manage all your equipment listings.',
        placement: 'right',
      },
      {
        target: '[data-tour="vendor-equipment-content"]',
        content: 'View and manage your active listings. Track views, inquiries, and listing performance.',
        placement: 'top',
      },
    ],
  },

  'vendor-inquiries': {
    label: 'My Inquiries',
    description: 'Manage customer inquiries',
    icon: 'InboxIcon',
    route: '/vendor-inquiries',
    roles: ['vendor'],
    steps: [
      {
        target: '[data-tour="nav-vendor-inquiries"]',
        content: 'Manage all customer inquiries about your equipment here.',
        placement: 'right',
      },
      {
        target: '[data-tour="vendor-inquiries-content"]',
        content: 'All inquiries from potential buyers are listed here with their contact details.',
        placement: 'top',
      },
    ],
  },

  'vendor-profile': {
    label: 'Business Profile',
    description: 'Showcase your company',
    icon: 'BuildingStorefrontIcon',
    route: '/vendor-profile',
    roles: ['vendor'],
    steps: [
      {
        target: '[data-tour="nav-vendor-profile"]',
        content: 'Your Business Profile showcases your company to potential buyers.',
        placement: 'right',
      },
      {
        target: '[data-tour="vendor-profile-content"]',
        content: 'Update your company information, logo, services, and contact details here.',
        placement: 'top',
      },
    ],
  },

  faqs: {
    label: 'FAQs',
    description: 'Answers to common questions',
    icon: 'QuestionMarkCircleIcon',
    route: '/faqs',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
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
    ],
  },

  'bug-reports': {
    label: 'Bug Reports',
    description: 'Report issues and track fixes',
    icon: 'BugAntIcon',
    route: '/bug-reports',
    roles: ['admin', 'owner', 'vendor'],
    steps: [
      {
        target: '[data-tour="nav-bug-reports"]',
        content: 'Bug Reports lets you report issues and track fixes to improve the platform.',
        placement: 'right-end',
      },
      {
        target: '[data-tour="report-bug-button"]',
        content: 'Click here to submit a new bug report. Include details, screenshots, and steps to reproduce.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="bug-filters"]',
        content: 'Filter by priority, category, or status to find specific reports.',
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
        target: '[data-tour="my-reports"]',
        content: 'View all your submitted reports and their current status.',
        placement: 'right',
      },
    ],
  },
};

/**
 * Get tours available for a given user role
 */
export const getAvailableTours = (role?: string): { key: PageTourKey; config: PageTourConfig }[] => {
  if (!role) return [];
  return (Object.entries(pageTours) as [PageTourKey, PageTourConfig][])
    .filter(([, config]) => config.roles.includes(role))
    .map(([key, config]) => ({ key, config }));
};

/**
 * Get the steps for a specific page tour
 */
export const getPageTourSteps = (pageKey: PageTourKey | null): Step[] => {
  if (!pageKey) return [];
  return pageTours[pageKey]?.steps ?? [];
};
