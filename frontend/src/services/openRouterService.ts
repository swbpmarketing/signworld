interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserContext {
  role?: string;
  name?: string;
  company?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

export const chatWithAI = async (
  messages: ChatMessage[],
  userContext?: UserContext
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        userRole: userContext?.role,
        userName: userContext?.name,
        userCompany: userContext?.company
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
};

// Sections that vendors cannot access
const VENDOR_RESTRICTED_SECTIONS = [
  'Reports', 'Success Stories', 'Brags', 'Forum', 'Library',
  'Owners Roster', 'Map Search', 'Videos', 'FAQs', 'User Management', 'Pending Approvals'
];

// Sections that owners cannot access
const OWNER_RESTRICTED_SECTIONS = [
  'User Management', 'Pending Approvals', 'Business Profile', 'Inquiries',
  'Vendor Equipment', 'Vendor Reports', 'Sales Stats', 'Vendor Dashboard'
];

// Helper to extract suggested sections from AI response
export const extractSuggestions = (
  aiResponse: string,
  userRole?: string
): Array<{ title: string; href: string; description: string }> => {
  const suggestions: Array<{ title: string; href: string; description: string }> = [];

  const sectionMap: Record<string, { href: string; description: string }> = {
    // General pages
    'Dashboard': { href: '/dashboard', description: 'View your business overview' },
    'Reports': { href: '/reports', description: 'Access business analytics' },
    'Calendar': { href: '/calendar', description: 'Manage events and schedules' },
    'Convention': { href: '/convention', description: 'Convention information' },
    'Chat': { href: '/chat', description: 'Message vendors and owners' },
    'Profile': { href: '/profile', description: 'View and edit your profile' },
    'Settings': { href: '/settings', description: 'Configure your account settings' },
    'Billing': { href: '/billing', description: 'Manage billing and payments' },

    // Owner pages
    'Success Stories': { href: '/brags', description: 'Read and share success stories' },
    'Brags': { href: '/brags', description: 'Read and share success stories' },
    'Forum': { href: '/forum', description: 'Join community discussions' },
    'Library': { href: '/library', description: 'Browse training documents and resources' },
    'Owners Roster': { href: '/owners', description: 'View franchise owner directory' },
    'Map Search': { href: '/map', description: 'Search franchise locations on map' },
    'Partners': { href: '/partners', description: 'Browse vendor directory' },
    'Videos': { href: '/videos', description: 'Watch training videos' },
    'Equipment': { href: '/equipment', description: 'Browse and order equipment' },
    'FAQs': { href: '/faqs', description: 'Get answers to common questions' },

    // Vendor pages
    'Vendor Dashboard': { href: '/dashboard', description: 'View your vendor dashboard' },
    'Business Profile': { href: '/vendor-profile', description: 'Edit your business info, logo, and specialties' },
    'Inquiries': { href: '/vendor-inquiries', description: 'View and respond to owner inquiries' },
    'Vendor Equipment': { href: '/vendor-equipment', description: 'Manage your equipment listings' },
    'Vendor Reports': { href: '/vendor-reports', description: 'View your sales statistics' },
    'Sales Stats': { href: '/vendor-reports', description: 'View your sales and inquiry statistics' },

    // Admin pages
    'User Management': { href: '/users', description: 'Manage users and permissions' },
    'Pending Approvals': { href: '/library/pending', description: 'Review pending content approvals' }
  };

  // Look for mentions of sections in the response
  for (const [section, info] of Object.entries(sectionMap)) {
    if (aiResponse.includes(section)) {
      // Skip restricted sections based on user role
      if (userRole === 'vendor' && VENDOR_RESTRICTED_SECTIONS.includes(section)) {
        continue;
      }
      if (userRole === 'owner' && OWNER_RESTRICTED_SECTIONS.includes(section)) {
        continue;
      }
      suggestions.push({
        title: section,
        href: info.href,
        description: info.description
      });
    }
  }

  // Remove duplicates and limit to 3 suggestions
  const uniqueSuggestions = suggestions.filter((item, index, self) =>
    index === self.findIndex((t) => t.title === item.title)
  ).slice(0, 3);

  return uniqueSuggestions;
};
