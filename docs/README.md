# Sign Company Dashboard Documentation

Welcome to the Sign Company Dashboard documentation. This directory contains comprehensive guides for setting up, deploying, and maintaining the application.

## Table of Contents

### Getting Started
- [Main README](../README.md) - Project overview and local setup
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Complete environment configuration reference

### Deployment
- [Render Quick Start](RENDER_QUICK_START.md) - 5-minute deployment guide for Render
- [Full Deployment Guide](DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md) - Step-by-step MongoDB Atlas configuration

### Architecture & Features
- Coming soon: Architecture documentation
- Coming soon: API reference
- Coming soon: Feature guides

---

## Quick Links

### Local Development

**Prerequisites:**
- Node.js v16+
- MongoDB (local or Atlas)
- AWS S3 account
- Google Maps API key

**Setup:**
```bash
# Install dependencies
npm run install-all

# Configure environment (see .env.example)
cp .env.example .env

# Start development servers
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:9000/api
- Health: http://localhost:9000/health

**Default Credentials:**
- Email: admin@signcompany.com
- Password: admin123

---

## Deployment Options

### Render.com (Recommended)

**Quick Start:**
See [RENDER_QUICK_START.md](RENDER_QUICK_START.md)

**Detailed Guide:**
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Requirements:**
- GitHub repository
- MongoDB Atlas
- AWS S3
- Google Maps API key

---

## Project Structure

```
sign-company-dashboard/
├── backend/              # Node.js + Express API
│   ├── config/           # Database and service configs
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth and validation middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── scripts/          # Seed and utility scripts
│   └── index.js          # Server entry point
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── types/        # TypeScript type definitions
│   └── package.json
├── docs/                 # Documentation (you are here!)
├── scripts/              # Build and deployment scripts
├── .env.example          # Environment template
├── package.json          # Root package manager
└── render.yaml           # Render deployment config
```

---

## Key Features

### Dashboard Modules

1. **Calendar/Events** - Event management with calendar view
2. **Convention** - Convention details and countdown
3. **Success Stories** - Blog-style success stories
4. **Forum** - Discussion threads for owners
5. **Library** - File management with S3 storage
6. **Owners Roster** - Searchable directory
7. **Map Search** - Interactive Google Maps integration
8. **Partners** - Preferred partner directory
9. **Videos** - YouTube-based learning center
10. **Equipment** - Equipment catalog and inquiries
11. **FAQs** - Categorized help center

### Technical Features

- JWT authentication
- Role-based access (admin/owner)
- File uploads to AWS S3
- Google Maps integration
- AI-powered search (optional)
- Responsive design
- Real-time updates

---

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Axios

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Multer (file uploads)
- AWS SDK (S3)

**Infrastructure:**
- MongoDB Atlas (database)
- AWS S3 (file storage)
- Render.com (hosting)
- Google Maps API

---

## Environment Configuration

All environment variables are documented in [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

**Required for deployment:**
- MongoDB Atlas connection string
- AWS S3 credentials and bucket
- Google Maps API key
- JWT secret

**Optional:**
- OpenRouter API key (AI search)
- Redis URL (caching)
- SMTP credentials (email)

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/me` - Get current user

### Resources
- `/api/events` - Calendar events
- `/api/conventions` - Convention data
- `/api/brags` - Success stories
- `/api/forum` - Discussion threads
- `/api/library` - File library
- `/api/owners` - Owner profiles
- `/api/partners` - Partner directory
- `/api/videos` - Video library
- `/api/equipment` - Equipment catalog
- `/api/faqs` - FAQ entries
- `/api/search` - AI search

Full API documentation coming soon.

---

## Security

### Best Practices
- Strong JWT secrets (32+ characters)
- HTTPS enforced in production
- CORS configured for specific origins
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload validation

### Access Control
- Role-based authorization (admin/owner)
- JWT token expiration (7 days)
- Protected routes in frontend and backend

---

## Monitoring & Maintenance

### Health Checks
- Endpoint: `GET /health`
- Returns: Server status, timestamp, environment

### Logs
- Render provides real-time logs
- Check for deployment errors
- Monitor API requests

### Backups
- MongoDB Atlas automatic backups
- S3 file versioning
- Regular database exports recommended

---

## Troubleshooting

### Common Issues

**Build Failures:**
- Verify all environment variables are set
- Check Node.js version (v16+)
- Clear node_modules and reinstall

**Database Connection:**
- Whitelist 0.0.0.0/0 in MongoDB Atlas
- Verify connection string format
- Check database user permissions

**File Uploads:**
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure bucket region matches

**CORS Errors:**
- Update CLIENT_URL environment variable
- Check backend CORS configuration
- Verify API endpoint URLs

---

## Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [AWS S3](https://docs.aws.amazon.com/s3/)
- [Google Maps API](https://developers.google.com/maps)

### GitHub Repository
https://github.com/gabtest61-sys/Sign-World

---

## Contributing

This is a private project for Sign Company internal use.

### Development Workflow
1. Make changes locally
2. Test thoroughly
3. Commit to GitHub
4. Render auto-deploys from main branch

---

## License

Private - Sign Company Internal Use Only

---

## Version History

**v1.0.0** - Initial release
- Complete MERN stack dashboard
- 11 functional modules
- AWS S3 integration
- Google Maps integration
- JWT authentication
- Render deployment ready

---

**Last Updated:** 2025-11-18

**Maintained by:** Sign Company Development Team
