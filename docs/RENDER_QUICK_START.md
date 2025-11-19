# Render Quick Start Guide

This is a condensed guide for deploying to Render. For detailed instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Prerequisites Checklist

- [ ] GitHub repository: https://github.com/gabtest61-sys/Sign-World
- [ ] Render.com account
- [ ] MongoDB Atlas account
- [ ] AWS S3 bucket and credentials
- [ ] Google Maps API key: `AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU`
- [ ] OpenRouter API key (optional)

---

## 5-Minute Setup

### 1. MongoDB Atlas (2 minutes)

**Need detailed help?** See [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) for step-by-step guide.

**Quick steps:**
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Database Access → Add user (username: `signcompany`, strong password)
4. Network Access → Allow 0.0.0.0/0
5. Copy connection string:
   ```
   mongodb+srv://signcompany:PASSWORD@cluster0.xxxxx.mongodb.net/sign-company-dashboard
   ```

### 2. Deploy to Render (2 minutes)

1. Go to https://dashboard.render.com
2. New → Blueprint
3. Connect repo: https://github.com/gabtest61-sys/Sign-World
4. Click "Apply"

### 3. Add Environment Variables (1 minute)

In Render dashboard → Environment, add:

**Required:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://signcompany:PASSWORD@...
JWT_SECRET=(click Generate)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
CLIENT_URL=https://YOUR-SERVICE.onrender.com
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
```

**Optional:**
```
OPENROUTER_API_KEY=your-openrouter-key
```

### 4. Deploy & Test

Wait 5-10 minutes for first deployment, then:

1. Visit: `https://YOUR-SERVICE.onrender.com`
2. Health check: `https://YOUR-SERVICE.onrender.com/health`
3. Create admin user (see below)
4. Login: admin@signcompany.com / admin123

---

## Create Admin User

**Option 1: Via Render Shell**
1. Render dashboard → Shell tab
2. Run: `node backend/scripts/resetAdmin.js`

**Option 2: Via MongoDB Atlas**
1. Connect to your database
2. Manually create user in `users` collection

**Default credentials:**
- Email: admin@signcompany.com
- Password: admin123

**IMPORTANT:** Change the password after first login!

---

## What Gets Deployed

The [render.yaml](../render.yaml) configuration automatically:
- Installs all dependencies (frontend + backend)
- Builds the React frontend
- Starts the Node.js server
- Sets up health checks
- Configures environment variables

---

## Cost

**Free Tier:**
- Render: Free (spins down after 15min inactivity)
- MongoDB Atlas: Free M0 cluster
- AWS S3: ~$0.50/month
- **Total: ~$0.50/month**

**Paid (Recommended):**
- Render Starter: $7/month
- MongoDB M2: $9/month
- AWS S3: ~$2/month
- **Total: ~$18/month**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check environment variables are set |
| Can't connect to DB | Whitelist 0.0.0.0/0 in MongoDB Network Access |
| File uploads fail | Verify AWS credentials and bucket name |
| Slow first load | Free tier spins down - upgrade to paid |
| CORS errors | Update `CLIENT_URL` to match Render URL |

---

## Next Steps

After deployment:
1. Change admin password
2. Test all features
3. Create owner accounts
4. Set up automatic backups
5. Consider upgrading to paid tier for production

---

## Resources

- [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Environment Variables Reference](ENVIRONMENT_VARIABLES.md)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

---

Generated: 2025-11-18
