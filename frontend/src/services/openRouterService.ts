interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

export const chatWithAI = async (
  messages: ChatMessage[]
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
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

// Helper to extract suggested sections from AI response
export const extractSuggestions = (aiResponse: string): Array<{ title: string; href: string; description: string }> => {
  const suggestions: Array<{ title: string; href: string; description: string }> = [];

  const sectionMap: Record<string, { href: string; description: string }> = {
    'Dashboard': { href: '/dashboard', description: 'View your business overview' },
    'Reports': { href: '/reports', description: 'Access business analytics' },
    'Calendar': { href: '/calendar', description: 'Manage events and schedules' },
    'Convention': { href: '/convention', description: 'Convention information' },
    'Success Stories': { href: '/brags', description: 'Read success stories' },
    'Brags': { href: '/brags', description: 'Read success stories' },
    'Forum': { href: '/forum', description: 'Join community discussions' },
    'Library': { href: '/library', description: 'Browse resources' },
    'Owners Roster': { href: '/owners', description: 'View franchise directory' },
    'Map Search': { href: '/map', description: 'Search by location' },
    'Partners': { href: '/partners', description: 'Browse vendor directory' },
    'Videos': { href: '/videos', description: 'Watch training videos' },
    'Equipment': { href: '/equipment', description: 'Order equipment' },
    'FAQs': { href: '/faqs', description: 'Get answers to common questions' }
  };

  // Look for mentions of sections in the response
  for (const [section, info] of Object.entries(sectionMap)) {
    if (aiResponse.includes(section)) {
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
