/**
 * OpenRouter API Configuration
 * 
 * This module manages the OpenRouter API key and configuration
 * IMPORTANT: Never commit the actual API key to version control
 */

module.exports = {
  // API Key should be stored in environment variable
  apiKey: process.env.OPENROUTER_API_KEY,
  
  // OpenRouter API endpoint
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Model configuration - using Claude Haiku for better instruction following
  model: 'anthropic/claude-3-haiku',
  
  // Default parameters for search queries
  defaultParams: {
    temperature: 0.3, // Lower temperature for more consistent parsing
    max_tokens: 500,  // Limit response size for search intent parsing
    top_p: 0.9
  },
  
  // Request headers
  getHeaders: () => ({
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.CLIENT_URL || 'https://sign-company-dashboard.com',
    'X-Title': 'Sign Company Dashboard Search'
  }),
  
  // Validate configuration
  isConfigured: () => {
    return !!process.env.OPENROUTER_API_KEY;
  }
};