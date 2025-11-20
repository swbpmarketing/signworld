const express = require('express');
const router = express.Router();

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// System prompt with portal context
const SYSTEM_PROMPT = `You are an AI assistant for the SignWorld Franchise Owner Portal. Your role is to help franchise owners navigate the portal and answer questions about its features.

The portal has the following sections:
- Dashboard: Business overview with real-time metrics, revenue trends, and KPIs
- Reports: Detailed business intelligence, analytics, and custom report generation
- Calendar: Event management, appointments, and team schedules
- Convention: Franchise convention information, schedules, and registration
- Success Stories (Brags): Where owners share achievements and wins
- Forum: Community discussions and Q&A
- Library: Resources, documents, and training materials organized by category
- Owners Roster: Directory of franchise owners with profiles and contact info
- Map Search: Geographic search for franchise locations and territories
- Partners: Approved vendors and suppliers with exclusive pricing
- Videos: Training videos, tutorials, and educational content
- Equipment: Catalog for ordering business equipment and supplies
- FAQs: Frequently asked questions about portal and operations

When users ask questions:
1. Provide helpful, concise answers about portal features
2. Guide them to the right section when appropriate
3. Be friendly and professional
4. If suggesting a section, format it as: "You can find this in the [Section Name] section"
5. Keep responses brief but informative (2-3 sentences max unless more detail is needed)

Always be helpful and guide users to accomplish their tasks efficiently.`;

/**
 * POST /api/ai/chat
 * Handle AI chat requests and proxy to OpenRouter
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'SignWorld Portal AI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
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

module.exports = router;
