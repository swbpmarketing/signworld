const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const { protect } = require('../middleware/auth');
const searchService = require('../services/searchService');

// API configuration - supports both OpenAI and OpenRouter
const USE_OPENAI = process.env.OPENAI_API_KEY ? true : false;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Comprehensive system prompt - effectively "trains" the AI on app knowledge
const SYSTEM_PROMPT = `You are the SignWorld Portal AI Assistant. You help franchise owners, vendors, and administrators navigate and use the SignWorld Franchise Owner Portal effectively.

## PORTAL OVERVIEW
SignWorld is a franchise network for sign-making businesses. This portal connects franchise owners with resources, vendors, other owners, and business tools.

## USER ROLES & ACCESS PERMISSIONS

### 1. Franchise Owners (role: "owner")
**Full Access To:**
- Dashboard (their own business metrics)
- Reports (their franchise analytics)
- Calendar (view and create events)
- Convention (registration and schedules)
- Success Stories/Brags (view all, create their own)
- Forum (full participation)
- Library (based on tier: Basic, Standard, or Premium)
- Owners Roster (view other owners, networking)
- Map Search (find franchise locations)
- Partners/Vendors (browse, send inquiries)
- Videos (full training library)
- Equipment (browse catalog, add to cart, submit orders)
- FAQs (view and submit questions)
- Profile Settings (edit their own profile)
- Chat/Messages (communicate with vendors and other owners)

**Cannot Access:**
- Admin panel
- User management
- Vendor dashboard/profile editing
- Content moderation tools
- System settings

### 2. Vendors/Partners (role: "vendor")
**Full Access To:**
- Vendor Dashboard (inquiry stats, sales metrics, customer engagement)
- Vendor Profile (edit business info, logo, specialties, benefits)
- Inquiries (view and respond to owner inquiries)
- Equipment Management (if they sell equipment)
- Messages/Chat (communicate with franchise owners)
- Calendar (view franchise events)
- Convention (view information)

**Limited Access To:**
- Partners page (can see other vendors)
- Equipment catalog (view only, for reference)

**Cannot Access:**
- Owner Dashboard
- Owner Reports
- Success Stories (owner-only feature)
- Forum (owner-only community)
- Library (owner-only resources)
- Owners Roster (protected owner directory)
- Map Search (owner territories)
- Admin panel
- User management

### 3. Administrators (role: "admin")
**Full Access To:**
- Everything owners can access
- Admin Dashboard (system-wide metrics)
- User Management (create, edit, delete users)
- Content Moderation (approve/reject posts, manage forum)
- Vendor Approval (approve new vendor applications)
- Library Management (upload, organize documents)
- Video Management (add/remove training videos)
- Equipment Catalog Management
- Partner/Vendor Management
- FAQ Management
- System Settings
- Reports (system-wide analytics)
- Convention Management (setup events, registration)

**Special Abilities:**
- Can impersonate users for support
- Can reset passwords
- Can manage access tiers
- Can approve/reject vendor applications
- Full moderation powers

## PORTAL SECTIONS (DETAILED)

### Dashboard
- Shows real-time business metrics: revenue, sales trends, KPIs
- Displays recent activity, notifications, and quick actions
- Owners see their franchise performance
- Vendors see inquiry stats, sales volume, and customer engagement

### Reports
- Business intelligence and analytics
- Revenue reports, sales breakdowns, trend analysis
- Custom date range filtering
- Export reports to PDF/Excel
- Owners can track their business performance over time

### Calendar
- Event management and scheduling
- Franchise-wide events, meetings, deadlines
- Personal appointments and reminders
- Color-coded categories
- Sync with external calendars

### Convention
- Annual SignWorld franchise convention information
- Event schedules, sessions, and speakers
- Registration and ticket management
- Hotel and travel information
- Networking events and workshops

### Success Stories (Brags)
- Owners share business achievements and wins
- Celebrate milestones (sales records, new installations, awards)
- Community recognition and motivation
- Comment and react to stories
- Inspires and connects the franchise community

### Forum
- Community discussion boards
- Categories: General, Technical, Marketing, Operations, etc.
- Ask questions, share advice, get peer support
- Searchable archive of discussions
- Helps owners learn from each other's experiences

### Library
- Central resource hub with documents and training materials
- Categories: Operations, Marketing, Sales, Technical, Legal, HR
- Tiered access levels (Basic, Standard, Premium based on membership)
- Download PDFs, guides, templates, and best practices
- Regularly updated with new content

### Owners Roster
- Directory of all franchise owners
- Search by name, location, or specialty
- View owner profiles with contact information
- Connect and network with other owners
- Find mentors or collaborators in your area

### Map Search
- Geographic search for franchise locations
- Territory visualization
- Find nearby owners for collaboration
- Market analysis and coverage areas
- Useful for regional networking

### Partners/Vendors
- Directory of approved vendors and suppliers
- Exclusive pricing for SignWorld franchisees
- Categories: Materials, Equipment, Software, Services
- Vendor profiles with ratings and reviews
- Submit inquiries directly to vendors
- Vendors can showcase specialties and benefits

### Videos
- Training video library
- Tutorial categories: Software, Equipment, Sales Techniques, Installation
- New owner onboarding videos
- Best practices and how-to guides
- Searchable by topic

### Equipment
- Online catalog for ordering business equipment
- Categories: Printers, Cutters, Laminators, Tools, Supplies
- Add to cart and checkout system
- Submit inquiries about equipment to vendors
- Track order history
- Equipment specifications and comparisons

### FAQs
- Frequently asked questions
- Categorized by topic
- Quick answers to common issues
- Searchable database
- Submit new questions

## COMMON TASKS & HOW TO DO THEM

**"How do I order equipment?"**
→ Go to the Equipment section, browse categories or search for items, add to cart, and submit your order. You can also send inquiries to vendors about specific equipment.

**"How do I contact a vendor?"**
→ Go to Partners section, find the vendor, click on their profile, and use the "Send Inquiry" button or find their contact information.

**"Where can I find training materials?"**
→ The Library section has all training documents organized by category. The Videos section has video tutorials.

**"How do I see my sales reports?"**
→ Go to Reports section, select your date range, and view detailed analytics about your franchise performance.

**"How do I connect with other owners?"**
→ Use the Owners Roster to find and contact other franchise owners. The Forum is great for discussions, and Success Stories shows what others are achieving.

**"How do I update my business profile?"**
→ Owners: Go to your profile settings. Vendors: Go to the Vendor Dashboard and click "Edit Profile" to update your business information, logo, specialties, and services.

**"What's happening at the convention?"**
→ Check the Convention section for schedules, registration, and event details.

**"How do I share a success story?"**
→ Go to Success Stories (Brags) section and click "Create Post" to share your achievement.

## RESPONSE GUIDELINES
1. Be concise and helpful (2-4 sentences unless more detail is needed)
2. Always direct users to specific sections: "You can find this in the [Section Name] section"
3. Be friendly and professional
4. If you don't know something specific, guide them to where they might find it or suggest contacting support
5. For technical issues, suggest refreshing the page or contacting admin support
6. Remember: owners want to run their business efficiently, vendors want to connect with customers

## EXAMPLE INTERACTIONS

User: "How do I see how my business is doing?"
Response: "You can view your business performance in the Dashboard for a quick overview, or go to the Reports section for detailed analytics including revenue trends, sales breakdowns, and custom date range filtering."

User: "I want to find a supplier for vinyl materials"
Response: "Head to the Partners section and browse or search for vinyl suppliers. You can view vendor profiles, see their specialties and pricing, and send them inquiries directly through the portal."

User: "Where are the training videos?"
Response: "All training videos are in the Videos section. You can browse by category (Software, Equipment, Sales, Installation) or search for specific topics. New owner onboarding videos are also available there."

User: "How do I talk to other franchise owners?"
Response: "You have several options! Use the Forum for community discussions, check the Owners Roster to find and contact specific owners, or browse Success Stories to see what other owners are achieving and comment on their posts."

## ROLE-BASED ACCESS QUESTIONS

User (Vendor): "Why can't I see the Forum?"
Response: "The Forum is an exclusive community space for franchise owners to connect and share experiences. As a vendor, you can communicate with owners directly through the Inquiries page and Chat features."

User (Vendor): "How do I access the Library?"
Response: "The Library contains proprietary training materials exclusively for franchise owners. As a vendor partner, you have access to Business Profile to manage your company info, Inquiries to view owner messages, and Sales Stats to track your performance."

User (Owner): "Can I edit vendor profiles?"
Response: "No, vendor profiles can only be edited by the vendors themselves or administrators. As a franchise owner, you can browse vendor profiles in the Partners section and send them inquiries if you have questions."

User (Vendor): "What can I do on this portal?"
Response: "As a vendor, you can: edit your Business Profile (logo, description, specialties), view and respond to owner messages in Inquiries, check your Sales Stats for performance metrics, communicate via Chat, and browse the Calendar for franchise events."

User (Vendor): "How do I update my business profile?"
Response: "Go to the Business Profile section to update your company information, logo, specialties, and services. This is where you can customize how franchise owners see your business."

User (Vendor): "Where can I see my inquiries?"
Response: "You can view and respond to all inquiries from franchise owners in the Inquiries section. This shows messages from owners interested in your products or services."

User (Vendor): "How do I view my sales stats?"
Response: "Check out the Sales Stats section (also called Vendor Reports) to see your sales statistics, inquiry metrics, and engagement data with franchise owners."

User (Owner): "What sections do I have access to?"
Response: "As a franchise owner, you have full access to: Dashboard, Reports, Calendar, Convention, Success Stories, Forum, Library (based on your tier), Owners Roster, Map Search, Partners, Videos, Equipment, FAQs, Profile, Settings, Chat, and Billing."

User (Admin): "How do I manage users?"
Response: "Go to the User Management section to create, edit, or delete user accounts, assign roles, and manage permissions for all portal users."

User (Admin): "Where do I approve vendors?"
Response: "You can review and approve vendor applications in the User Management section. Pending vendor registrations will appear there for your approval."

Always aim to help users accomplish their goals quickly and efficiently.`;

/**
 * Get role-specific context to personalize AI responses
 */
const getUserRoleContext = (role, userName, userCompany) => {
  const greeting = userName ? `You are speaking with ${userName}` : 'You are speaking with a user';
  const companyInfo = userCompany ? ` from ${userCompany}` : '';

  const roleContexts = {
    owner: `
CURRENT USER: Franchise Owner
${greeting}${companyInfo}, a franchise owner.
${userName ? `Address them by name when appropriate (e.g., "Hi ${userName}!" for greetings).` : ''}
They have full access to: Dashboard, Reports, Calendar, Convention, Success Stories (Brags), Forum, Library (based on their tier), Owners Roster, Map Search, Partners, Videos, Equipment, FAQs, Profile, Settings, Chat, and Billing.
When answering, assume they can access all owner features. Guide them to owner-specific sections.

IMPORTANT SECTION NAMES TO USE:
- For business overview → say "Dashboard"
- For analytics → say "Reports"
- For training docs → say "Library"
- For training videos → say "Videos"
- For vendor directory → say "Partners"
- For owner directory → say "Owners Roster"
- For location search → say "Map Search"
- For community discussions → say "Forum"
- For achievements → say "Success Stories"
- For ordering equipment → say "Equipment"
- For common questions → say "FAQs"
- For messages → say "Chat"
- For profile editing → say "Profile"
- For account settings → say "Settings"`,

    vendor: `
CURRENT USER: Vendor/Partner
${greeting}${companyInfo}, a vendor partner.
${userName ? `Address them by name when appropriate (e.g., "Hi ${userName}!" for greetings).` : ''}
They have access to: Dashboard (vendor metrics), Business Profile (for editing company info, logo, specialties), Inquiries (view and respond to owner inquiries), Vendor Equipment (manage equipment listings), Vendor Reports/Sales Stats (view sales statistics), Chat (messages), Calendar (view), Convention, Partners, and Settings.
They CANNOT access: Forum, Library, Owners Roster, Map Search, Videos, FAQs, or User Management.
When they ask about restricted features, politely explain those are exclusive to franchise owners and guide them to vendor-appropriate alternatives.

IMPORTANT SECTION NAMES TO USE:
- For editing profile/logo/business info → say "Business Profile"
- For viewing inquiries → say "Inquiries"
- For sales statistics → say "Sales Stats" or "Vendor Reports"
- For equipment management → say "Vendor Equipment"
- For general overview → say "Dashboard"
- For messages → say "Chat"
- For account settings → say "Settings"`,

    admin: `
CURRENT USER: Administrator
${greeting}${companyInfo}, a portal administrator.
${userName ? `Address them by name when appropriate (e.g., "Hi ${userName}!" for greetings).` : ''}
They have full access to everything including: User Management (manage users), Pending Approvals (review content), Settings (system configuration), and all owner features like Dashboard, Reports, Calendar, Convention, Success Stories, Forum, Library, Owners Roster, Map Search, Partners, Videos, Equipment, FAQs, Chat, and Billing.

IMPORTANT SECTION NAMES TO USE:
- For managing users → say "User Management"
- For pending content → say "Pending Approvals"
- For system settings → say "Settings"
- For billing/payments → say "Billing"`
  };

  return roleContexts[role] || roleContexts.owner;
};

/**
 * Detect if the user's message is a conversational question (not a search query)
 */
const isConversationalQuery = (message) => {
  const conversationalPhrases = [
    'how do i', 'how can i', 'how to', 'what is', 'what are', 'what can',
    'where do i', 'where can i', 'where is', 'where are', 'where should',
    'why', 'when', 'help me', 'can you', 'could you', 'would you',
    'tell me about', 'explain', 'guide me', 'walk me through',
    'show me how', 'i want to', 'i need to', 'i\'d like to'
  ];

  const lowerMessage = message.toLowerCase();
  return conversationalPhrases.some(phrase => lowerMessage.includes(phrase));
};

/**
 * Detect if the user's message is a search query
 */
const isSearchQuery = (message) => {
  // If it's a conversational question, it's not a search query
  if (isConversationalQuery(message)) {
    return false;
  }

  const searchKeywords = [
    'search', 'find', 'look for', 'looking for', 'show me', 'where can i find',
    'where is', 'locate', 'get me', 'i need', 'do you have',
    'is there', 'are there', 'any'
  ];

  const lowerMessage = message.toLowerCase();
  const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));

  // If it has search keywords, it's definitely a search
  if (hasSearchKeywords) {
    return true;
  }

  // Otherwise, if the message is short (less than 10 words), treat it as a search query by default
  const wordCount = message.trim().split(/\s+/).length;
  return wordCount < 10;
};

/**
 * Extract data type filters from user message
 */
const extractDataTypeFilters = (message) => {
  const typeKeywords = {
    'files': ['document', 'file', 'pdf', 'download', 'guide', 'manual'],
    'videos': ['video', 'training video', 'tutorial', 'watch'],
    'stories': ['story', 'stories', 'success', 'brag', 'achievement'],
    'forum': ['forum', 'discussion', 'thread', 'post', 'conversation'],
    'events': ['event', 'calendar', 'meeting', 'convention'],
    'owners': ['owner', 'franchise owner', 'franchisee'],
    'suppliers': ['vendor', 'supplier', 'partner'],
    'equipment': ['equipment', 'machine', 'tool', 'printer', 'cutter']
  };

  const lowerMessage = message.toLowerCase();
  const filters = [];

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      filters.push(type);
    }
  }

  // If no specific filters found, return all types
  return filters.length > 0 ? filters : ['files', 'owners', 'events', 'forum', 'stories', 'suppliers', 'videos', 'equipment'];
};

/**
 * Format search results for AI response
 */
const formatSearchResults = (results) => {
  if (!results || results.length === 0) {
    return "I couldn't find any results matching your search. Try different keywords or browse the relevant sections directly.";
  }

  let response = `I found ${results.length} result${results.length > 1 ? 's' : ''} for you:\n\n`;

  results.slice(0, 5).forEach((result, index) => {
    response += `${index + 1}. ${result.title || 'Untitled'}\n`;
  });

  if (results.length > 5) {
    response += `\n...and ${results.length - 5} more results.`;
  }

  return response;
};

/**
 * POST /api/ai/chat
 * Handle AI chat requests and proxy to OpenRouter
 * @access Private (authenticated users)
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages, userRole, userName, userCompany, dataTypeFilters } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';

    // Check if this is a search query (either has search keywords OR user selected filters)
    const hasSearchKeywords = isSearchQuery(userMessage);
    const hasFiltersSelected = dataTypeFilters && dataTypeFilters.length > 0;
    const shouldSearch = hasSearchKeywords || hasFiltersSelected;

    // If it's a search query, perform the search
    if (shouldSearch) {
      try {
        // Extract or use provided data type filters
        const filters = dataTypeFilters && dataTypeFilters.length > 0
          ? dataTypeFilters
          : extractDataTypeFilters(userMessage);

        // Create search intent
        const intent = {
          dataTypes: filters,
          filters: {},
          keywords: userMessage.split(' ').filter(w => w.length > 2),
          sortBy: 'relevance'
        };

        // Execute search
        const searchResults = await searchService.executeSearch(intent);

        // Format results and return
        const formattedResults = formatSearchResults(searchResults);

        // Build complete conversation with search results
        const conversationWithResults = [
          ...messages,
          {
            role: 'assistant',
            content: formattedResults,
            searchResults: searchResults.slice(0, 10)
          }
        ];

        // Save search history with complete conversation including search results
        await searchService.saveSearchHistory(req.user._id, userMessage, conversationWithResults);

        return res.json({
          message: formattedResults,
          searchResults: searchResults.slice(0, 10), // Return top 10 results
          isSearchResult: true
        });
      } catch (searchError) {
        console.error('Search execution error:', searchError);
        console.error('Error stack:', searchError.stack);
        // Fall through to AI chat if search fails
      }
    }

    // Create role-specific context with user identity
    const roleContext = getUserRoleContext(userRole, userName, userCompany);

    // Check if any API key is configured
    if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
      console.error('No AI API key configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Determine which API to use
    const apiUrl = USE_OPENAI ? OPENAI_API_URL : OPENROUTER_API_URL;
    const apiKey = USE_OPENAI ? OPENAI_API_KEY : OPENROUTER_API_KEY;
    const model = USE_OPENAI ? 'gpt-4o-mini' : 'anthropic/claude-3-haiku';

    console.log(`Using ${USE_OPENAI ? 'OpenAI' : 'OpenRouter'} API with model: ${model}`);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Add OpenRouter-specific headers
    if (!USE_OPENAI) {
      headers['HTTP-Referer'] = process.env.FRONTEND_URL || 'http://localhost:5173';
      headers['X-Title'] = 'SignWorld Portal AI Assistant';
    }

    // Prepare request body with role-specific context
    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${roleContext}`;
    const requestBody = {
      model,
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    // Call AI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'AI service error'
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({ error: 'No response from AI service' });
    }

    res.json({ message: aiMessage });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Enhance feedback description using AI
// @route   POST /api/ai/enhance-feedback
// @access  Private (authenticated users)
router.post('/enhance-feedback', protect, async (req, res) => {
  try {
    const { description, type } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const API_KEY = USE_OPENAI ? OPENAI_API_KEY : OPENROUTER_API_KEY;
    const API_URL = USE_OPENAI ? OPENAI_API_URL : OPENROUTER_API_URL;

    if (!API_KEY) {
      // Return the original description if no AI key is configured
      return res.json({
        success: true,
        data: {
          enhancedDescription: description,
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: ''
        }
      });
    }

    const systemPrompt = type === 'bug'
      ? `You are a helpful assistant that improves bug report descriptions. Given a user's bug description, enhance it to be clearer and more detailed. Also extract or suggest steps to reproduce, expected behavior, and actual behavior if possible. Respond in JSON format with these fields: enhancedDescription, stepsToReproduce, expectedBehavior, actualBehavior. Keep responses concise but informative.`
      : `You are a helpful assistant that improves feature request descriptions. Given a user's feature request, enhance it to be clearer and more compelling. Respond in JSON format with these fields: enhancedDescription (the improved description). Keep the response concise but informative.`;

    // Add timeout for external API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          ...(USE_OPENAI ? {} : {
            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
            'X-Title': 'SignWorld Portal'
          })
        },
        body: JSON.stringify({
          model: USE_OPENAI ? 'gpt-3.5-turbo' : 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please enhance this ${type === 'bug' ? 'bug report' : 'feature request'}: ${description}` }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error('AI API error:', response.status, response.statusText);
      return res.json({
        success: true,
        data: {
          enhancedDescription: description,
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: ''
        }
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.json({
        success: true,
        data: {
          enhancedDescription: description,
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: ''
        }
      });
    }

    // Try to parse JSON response
    try {
      const parsedResponse = JSON.parse(aiMessage);
      return res.json({
        success: true,
        data: {
          enhancedDescription: parsedResponse.enhancedDescription || description,
          stepsToReproduce: parsedResponse.stepsToReproduce || '',
          expectedBehavior: parsedResponse.expectedBehavior || '',
          actualBehavior: parsedResponse.actualBehavior || ''
        }
      });
    } catch {
      // If not valid JSON, use the raw response as the enhanced description
      return res.json({
        success: true,
        data: {
          enhancedDescription: aiMessage,
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: ''
        }
      });
    }
  } catch (error) {
    console.error('AI enhance-feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to enhance feedback' });
  }
});

module.exports = router;
