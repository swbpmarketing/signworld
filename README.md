# Sign Company Dashboard

A modern internal dashboard for Sign Company Owners built with the MERN stack.

## Features

- 📅 **Calendar/Events** - Full calendar system with event management
- 🏛 **Convention** - Convention details with countdown timer
- 📝 **Success Stories** - Blog-style success stories platform
- 💬 **Forum** - Thread-based owner discussions
- 📂 **Library** - File management system with S3 integration
- 👥 **Owners Roster** - Searchable owner directory
- 🗺️ **Map Search** - Interactive map with owner locations
- 🤝 **Partners** - Preferred partner directory
- 🎥 **Videos** - YouTube-based learning center
- 🛒 **Equipment** - Equipment catalog with inquiry system
- ❓ **FAQs** - Help center with categorized FAQs

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: Amazon S3
- **Maps**: Google Maps API

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- AWS Account (for S3)
- Google Maps API Key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gabtest61-sys/Sign-World.git
cd sign-company-dashboard
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:

Copy the example file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=9000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sign-company-dashboard
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sign-company-dashboard-files
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:9000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

See [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md) for detailed configuration.

4. Create an admin user:
```bash
npm run seed:admin
```

5. Run the development server:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:9000
- Frontend on http://localhost:5173

## Login Credentials

After running the seed script, use these credentials:
- **Email:** admin@signcompany.com
- **Password:** admin123

Admins can create additional owner accounts from the dashboard.

## Project Structure

```
sign-company-dashboard/
├── backend/            # Backend (Node.js + Express)
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── index.js        # Server entry point
├── frontend/           # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
│   └── package.json
├── docs/               # Documentation
│   ├── README.md       # Documentation index
│   └── ...             # Feature and deployment guides
├── scripts/            # Build and deployment scripts
├── .env                # Local environment variables
└── package.json        # Root package manager
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/users` - Get all users
- `GET /api/events` - Get all events
- ... (and more for each module)

## Documentation

Comprehensive documentation is available in the [docs/](docs/) folder:

- [Documentation Index](docs/README.md) - Complete documentation guide
- [Render Quick Start](docs/RENDER_QUICK_START.md) - 5-minute deployment guide
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) - Configuration reference

## Deployment

### Quick Deploy to Render

See [Render Quick Start Guide](docs/RENDER_QUICK_START.md) for a 5-minute deployment.

**Prerequisites:**
- MongoDB Atlas account
- AWS S3 bucket
- Google Maps API key

**One-Click Deploy:**
1. Push to GitHub
2. Connect to Render via Blueprint
3. Configure environment variables
4. Deploy!

For detailed instructions, see the [Full Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

## License

Private - Sign Company Internal Use Only# Force Render rebuild
