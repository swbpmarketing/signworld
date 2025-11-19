# Render Deployment Guide

This guide will walk you through deploying the Sign Company Dashboard to Render.com.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with the repository at: https://github.com/gabtest61-sys/Sign-World
2. A Render.com account (sign up at https://render.com)
3. A MongoDB Atlas account (for cloud database)
4. AWS S3 credentials (for file uploads)
5. Google Maps API Key
6. OpenRouter API Key (optional, for AI search)

---

## Step 1: Set Up MongoDB Atlas

MongoDB Atlas provides a free cloud-hosted database for your application.

**Detailed Setup Guide:** See [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) for step-by-step instructions with screenshots and troubleshooting.

**Quick Summary:**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (select the free M0 tier)
3. Create a database user:
   - Click "Database Access" → "Add New Database User"
   - Choose password authentication
   - Username: `signcompany`
   - Password: Generate a strong password and save it
   - Set role to "Read and write to any database"

4. Whitelist Render's IP addresses:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is safe because authentication is still required

5. Get your connection string:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `sign-company-dashboard`
   - Example: `mongodb+srv://signcompany:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority`

**Need help?** See the [complete MongoDB Atlas guide](MONGODB_ATLAS_SETUP.md).

---

## Step 2: Set Up AWS S3 Bucket

1. Log in to AWS Console
2. Go to S3 service
3. Create a new bucket:
   - Name: `sign-company-dashboard-files` (or your preferred name)
   - Region: `us-east-1` (or your preferred region)
   - Uncheck "Block all public access" (files will be accessed via signed URLs)
   - Enable versioning (optional but recommended)

4. Create IAM user for programmatic access:
   - Go to IAM → Users → Add User
   - User name: `sign-company-s3-user`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Save the Access Key ID and Secret Access Key

---

## Step 3: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository: https://github.com/gabtest61-sys/Sign-World
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to create the service

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: sign-company-dashboard
   - **Runtime**: Node
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

---

## Step 4: Configure Environment Variables

In your Render service dashboard, go to "Environment" and add these variables:

### Required Variables:

```
NODE_ENV=production
```

```
MONGODB_URI=mongodb+srv://signcompany:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority
```
(Use your MongoDB Atlas connection string)

```
JWT_SECRET=
```
(Click "Generate" to auto-generate a secure secret)

```
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
```

```
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
```

```
AWS_REGION=us-east-1
```

```
AWS_S3_BUCKET=sign-company-dashboard-files
```

```
GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
```

```
CLIENT_URL=https://YOUR_SERVICE_NAME.onrender.com
```
(Replace with your actual Render URL, e.g., https://sign-company-dashboard.onrender.com)

```
VITE_API_URL=https://YOUR_SERVICE_NAME.onrender.com/api
```

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
```

### Optional Variables:

```
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
```
(Only if you want AI search functionality)

```
REDIS_URL=redis://...
```
(Only if you set up Redis for caching)

---

## Step 5: Initial Deployment

1. After adding all environment variables, Render will automatically deploy
2. Watch the deployment logs in the Render dashboard
3. First deployment takes 5-10 minutes
4. Once deployed, you'll see "Deploy succeeded" and your service URL

---

## Step 6: Create Admin User

After the first deployment:

1. Go to your Render service dashboard
2. Click "Shell" tab (or use SSH)
3. Run the admin seed script:

```bash
node backend/scripts/resetAdmin.js
```

Or manually create via MongoDB Compass/Atlas:
- Connect to your MongoDB Atlas database
- Insert a document in the `users` collection

**Default Admin Credentials:**
- Email: admin@signcompany.com
- Password: admin123

---

## Step 7: Update CORS Settings (if needed)

If you encounter CORS errors, update [backend/index.js](../backend/index.js):

```javascript
const allowedOrigins = [
  'https://YOUR_SERVICE_NAME.onrender.com',
  // Add any other domains if needed
];
```

Commit and push changes to trigger a new deployment.

---

## Step 8: Test Your Deployment

1. Visit your Render URL: `https://YOUR_SERVICE_NAME.onrender.com`
2. Test the health check: `https://YOUR_SERVICE_NAME.onrender.com/health`
3. Test the API: `https://YOUR_SERVICE_NAME.onrender.com/api/test`
4. Log in with admin credentials
5. Test all features:
   - Calendar/Events
   - Success Stories
   - Forum
   - Library (file upload/download)
   - Map Search
   - Owner Roster
   - Partners
   - Videos
   - Equipment
   - FAQs

---

## Troubleshooting

### Deployment Fails

- Check build logs in Render dashboard
- Ensure all environment variables are set correctly
- Verify MongoDB connection string is correct

### Can't Connect to Database

- Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)
- Verify database user credentials
- Ensure connection string has correct password and database name

### File Uploads Don't Work

- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure bucket name matches environment variable

### Health Check Failing

- The app has a `/health` endpoint configured
- Render will mark service as unhealthy if this fails
- Check logs to see what's wrong

### Free Tier Limitations

Render's free tier:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month of free usage
- Consider upgrading to paid tier for production use

---

## Automatic Deployments

Render automatically deploys when you push to your GitHub repository:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Render detects the push and automatically deploys
4. Watch the deployment in Render dashboard

---

## Custom Domain (Optional)

To use your own domain:

1. Go to your Render service → "Settings"
2. Scroll to "Custom Domain"
3. Add your domain
4. Update your DNS records as instructed by Render
5. Update `CLIENT_URL` and `VITE_API_URL` environment variables

---

## Monitoring

Render provides:
- Real-time logs
- Metrics (CPU, memory, bandwidth)
- Health check status
- Deployment history

Access these in your service dashboard.

---

## Cost Estimate

**Free Tier:**
- Web Service: Free (with limitations)
- MongoDB Atlas: Free M0 cluster
- AWS S3: ~$0.50/month for typical usage
- Total: ~$0.50/month

**Paid Tier (Recommended for Production):**
- Render Web Service: $7/month (Starter)
- MongoDB Atlas: $9/month (M2 cluster)
- AWS S3: ~$2/month
- Total: ~$18/month

---

## Next Steps

After successful deployment:

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automatic backups for MongoDB
4. Set up staging environment for testing
5. Document any custom configuration
6. Train users on the system

---

## Support

For issues:
- Render Support: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- AWS S3: https://docs.aws.amazon.com/s3/

---

## Security Checklist

- [ ] Strong JWT_SECRET generated
- [ ] MongoDB database password is strong
- [ ] AWS credentials are for limited IAM user
- [ ] Environment variables are not committed to git
- [ ] Admin password changed from default
- [ ] HTTPS is enabled (automatic on Render)
- [ ] CORS origins are restricted
- [ ] S3 bucket has proper permissions

---

## Quick Reference

**Service URL Structure:**
- Frontend: `https://YOUR_SERVICE.onrender.com`
- API: `https://YOUR_SERVICE.onrender.com/api`
- Health: `https://YOUR_SERVICE.onrender.com/health`

**Important Files:**
- [render.yaml](../render.yaml) - Deployment configuration
- [backend/index.js](../backend/index.js) - Server configuration
- [.env.example](../.env.example) - Environment variables template

**GitHub Repository:**
https://github.com/gabtest61-sys/Sign-World

---

Generated: 2025-11-18
