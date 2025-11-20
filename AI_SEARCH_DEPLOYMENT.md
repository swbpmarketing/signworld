# AI Search Production Deployment Guide

This guide explains how to deploy the AI-powered search feature to production securely.

## 🔒 Security Architecture

The AI search is now configured to be **production-ready** with the OpenRouter API key secured on the backend:

- ✅ **Frontend**: No API keys exposed - calls backend API
- ✅ **Backend**: API key secured as environment variable
- ✅ **Production**: API key never exposed to clients

## 📋 Setup Instructions

### **1. Backend Configuration**

Add the OpenRouter API key to your backend environment variables:

#### For Render, Heroku, Vercel, etc:
Add this environment variable in your hosting platform's dashboard:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

#### For local development:
Create a `.env` file in the `backend` folder (if it doesn't exist):

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### **2. Frontend Configuration**

The frontend is already configured to call your backend API. Just ensure `VITE_API_URL` is set correctly:

#### Development (frontend/.env):
```env
VITE_API_URL=http://localhost:9000/api
```

#### Production:
Update `VITE_API_URL` to your production backend URL:
```env
VITE_API_URL=https://your-backend.com/api
```

### **3. Deploy**

#### Backend:
1. Push your code to your repository
2. Add `OPENROUTER_API_KEY` environment variable in your hosting platform
3. Deploy the backend

#### Frontend:
1. Update `VITE_API_URL` to your production backend URL
2. Build and deploy the frontend

## 🎯 How It Works

### Architecture Flow:
```
User → Frontend (CTRL+K) → Backend API (/api/ai/chat) → OpenRouter → Claude AI
                                       ↑
                              API Key (Secure)
```

### Request Flow:
1. User opens AI search modal (CTRL+K)
2. Frontend sends chat messages to `/api/ai/chat`
3. Backend adds system prompt and calls OpenRouter
4. OpenRouter processes with Claude 3.5 Sonnet
5. Backend returns AI response to frontend
6. Frontend displays response with suggestions

## 🔧 Testing

### Local Testing:
```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

Then:
1. Open http://localhost:5173
2. Login with demo credentials
3. Press **CTRL+K** to open AI search
4. Ask a question like "How do I view reports?"

### Production Testing:
1. Deploy backend with `OPENROUTER_API_KEY` environment variable
2. Deploy frontend with production `VITE_API_URL`
3. Test AI search in production

## 📁 Files Modified

### Backend:
- ✅ `backend/src/routes/ai.js` - New AI chat endpoint
- ✅ `backend/index.js` - Registered AI route

### Frontend:
- ✅ `frontend/src/services/openRouterService.ts` - Updated to call backend
- ✅ `frontend/src/components/AISearchModal.tsx` - AI search modal
- ✅ `frontend/src/components/Layout.tsx` - Integrated search with CTRL+K
- ✅ `frontend/.env` - Removed client-side API key

## 🌐 Platform-Specific Deployment

### Render:
1. Go to your backend service → Environment
2. Add: `OPENROUTER_API_KEY` = `your_key_here`
3. Save and redeploy

### Vercel:
1. Go to Project Settings → Environment Variables
2. Add: `OPENROUTER_API_KEY` = `your_key_here`
3. Redeploy

### Heroku:
```bash
heroku config:set OPENROUTER_API_KEY=your_key_here
```

### Railway:
1. Go to your project → Variables
2. Add: `OPENROUTER_API_KEY` = `your_key_here`
3. Redeploy

## ✨ Features

- **AI-Powered Search**: Natural language understanding with Claude 3.5 Sonnet
- **Context-Aware**: Knows all portal sections and features
- **Smart Suggestions**: Automatically suggests relevant portal sections
- **Conversation Memory**: Maintains context across questions
- **Keyboard Shortcut**: Quick access with CTRL+K (or CMD+K)
- **Dark Mode**: Full dark mode support
- **Mobile Friendly**: Responsive design

## 💡 Tips

1. **Cost Control**: The backend limits responses to 500 tokens to control costs
2. **Model Selection**: You can change the AI model in `backend/src/routes/ai.js` line 47
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Monitoring**: Monitor OpenRouter usage at https://openrouter.ai/

## 🚨 Troubleshooting

### "AI service not configured" error:
- Check that `OPENROUTER_API_KEY` is set in backend environment
- Restart backend after adding environment variable

### "Failed to get AI response":
- Check backend logs for errors
- Verify frontend `VITE_API_URL` points to correct backend
- Ensure backend `/api/ai/chat` endpoint is accessible

### Frontend can't reach backend:
- Check CORS configuration in `backend/index.js`
- Verify `VITE_API_URL` is correct
- Check network tab in browser dev tools

## 📞 Support

For issues:
1. Check backend logs
2. Check browser console
3. Verify environment variables are set
4. Test `/api/ai/chat` endpoint directly with Postman

---

**Important**: Never commit API keys to version control! Always use environment variables.
