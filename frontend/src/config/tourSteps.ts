import type { Step } from 'react-joyride';

/**
 * Comprehensive product tour steps covering all main features
 * Each category includes a sidebar step and a content area step
 */
export const tourSteps: Step[] = [
  // Welcome
  {
    target: 'body',
    content: 'Welcome to the Sign Company Dashboard! Let\'s take a quick tour of all the main features available to you.',
    placement: 'center',
    disableBeacon: true,
  },

  // Top bar features (moved here so they're shown early)
  {
    target: '[data-tour="search-button"]',
    content: 'Use the Search feature (or press Ctrl+K) to quickly find anything across the platform.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications-button"]',
    content: 'Check your Notifications here for updates, messages, and important alerts.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    content: 'Access your Profile, Settings, and other account options from this menu.',
    placement: 'bottom',
  },

  // Dashboard
  {
    target: '[data-tour="nav-dashboard"]',
    content: 'Start here at the Dashboard to see an overview of your key metrics and recent activity.',
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-content"]',
    content: 'The Dashboard displays important statistics, charts, and quick access to your most-used features.',
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
    content: 'Manage all users in the system, including owners and vendors.',
    placement: 'right',
  },
  {
    target: '[data-tour="user-management-content"]',
    content: 'Add, edit, or remove users, assign roles, and manage permissions from here.',
    placement: 'bottom',
  },

  // Calendar
  {
    target: '[data-tour="nav-calendar"]',
    content: 'Keep track of important dates, events, and deadlines in the Calendar.',
    placement: 'right',
  },
  {
    target: '[data-tour="calendar-content"]',
    content: 'View all upcoming events, add new ones, and manage your schedule efficiently.',
    placement: 'bottom',
  },

  // Convention
  {
    target: '[data-tour="nav-convention"]',
    content: 'Find information about industry conventions and networking opportunities.',
    placement: 'right',
  },
  {
    target: '[data-tour="convention-content"]',
    content: 'Browse upcoming conventions, register for events, and connect with other industry professionals.',
    placement: 'bottom',
  },

  // Success Stories (Brags)
  {
    target: '[data-tour="nav-brags"]',
    content: 'Share and celebrate Success Stories from the community.',
    placement: 'right',
  },
  {
    target: '[data-tour="brags-content"]',
    content: 'Post your achievements, view others\' success stories, and get inspired by the community.',
    placement: 'bottom',
  },

  // Forum
  {
    target: '[data-tour="nav-forum"]',
    content: 'Engage with the community through discussions in the Forum.',
    placement: 'right',
  },
  {
    target: '[data-tour="forum-content"]',
    content: 'Start new threads, participate in discussions, and get answers from experienced members.',
    placement: 'bottom',
  },

  // Chat
  {
    target: '[data-tour="nav-chat"]',
    content: 'Connect instantly with other members through real-time Chat.',
    placement: 'right',
  },
  {
    target: '[data-tour="chat-content"]',
    content: 'Send direct messages, create group chats, and collaborate with your network.',
    placement: 'bottom',
  },

  // Library
  {
    target: '[data-tour="nav-library"]',
    content: 'Access the Library for valuable resources and documents.',
    placement: 'right',
  },
  {
    target: '[data-tour="library-content"]',
    content: 'Browse files, templates, guides, and other shared resources from the community.',
    placement: 'bottom',
  },

  // Owners Roster
  {
    target: '[data-tour="nav-owners"]',
    content: 'Browse the Owners Roster to connect with other sign company owners.',
    placement: 'right',
  },
  {
    target: '[data-tour="owners-content"]',
    content: 'Search for owners by location, view profiles, and expand your professional network.',
    placement: 'bottom',
  },

  // Map Search
  {
    target: '[data-tour="nav-map"]',
    content: 'Use Map Search to find owners and vendors by geographic location.',
    placement: 'right',
  },
  {
    target: '[data-tour="map-content"]',
    content: 'Explore the interactive map to discover nearby businesses and potential partners.',
    placement: 'bottom',
  },

  // Partners
  {
    target: '[data-tour="nav-partners"]',
    content: 'View our trusted Partners who offer special benefits to members.',
    placement: 'right',
  },
  {
    target: '[data-tour="partners-content"]',
    content: 'Discover partner offers, discounts, and exclusive deals available to you.',
    placement: 'bottom',
  },

  // Videos
  {
    target: '[data-tour="nav-videos"]',
    content: 'Access training Videos and educational content.',
    placement: 'right',
  },
  {
    target: '[data-tour="videos-content"]',
    content: 'Watch tutorials, webinars, and industry insights to grow your business.',
    placement: 'bottom',
  },

  // Equipment
  {
    target: '[data-tour="nav-equipment"]',
    content: 'Browse Equipment listings to buy or sell sign-making tools and machinery.',
    placement: 'right',
  },
  {
    target: '[data-tour="equipment-content"]',
    content: 'Search for equipment by category, compare prices, and connect with sellers.',
    placement: 'bottom',
  },

  // Vendor-specific: My Listings
  {
    target: '[data-tour="nav-vendor-equipment"]',
    content: 'Vendors: Manage your Equipment Listings here.',
    placement: 'right',
  },
  {
    target: '[data-tour="vendor-equipment-content"]',
    content: 'Add new equipment for sale, edit existing listings, and track your inventory.',
    placement: 'bottom',
  },

  // Vendor-specific: My Inquiries
  {
    target: '[data-tour="nav-vendor-inquiries"]',
    content: 'Vendors: View and respond to customer Inquiries about your equipment.',
    placement: 'right',
  },
  {
    target: '[data-tour="vendor-inquiries-content"]',
    content: 'Manage all inquiries, respond to potential buyers, and close deals.',
    placement: 'bottom',
  },

  // Vendor-specific: Business Profile
  {
    target: '[data-tour="nav-vendor-profile"]',
    content: 'Vendors: Update your Business Profile to showcase your company.',
    placement: 'right',
  },
  {
    target: '[data-tour="vendor-profile-content"]',
    content: 'Edit your company information, upload photos, and highlight what makes you unique.',
    placement: 'bottom',
  },

  // FAQs
  {
    target: '[data-tour="nav-faqs"]',
    content: 'Find answers to common questions in the FAQs section.',
    placement: 'right',
  },
  {
    target: '[data-tour="faqs-content"]',
    content: 'Search the knowledge base for help with features, billing, and general questions.',
    placement: 'bottom',
  },

  // Bug Reports
  {
    target: '[data-tour="nav-bug-reports"]',
    content: 'Report any issues or bugs you encounter here.',
    placement: 'right',
  },
  {
    target: '[data-tour="bug-reports-content"]',
    content: 'Submit bug reports, track their status, and help us improve the platform.',
    placement: 'bottom',
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
