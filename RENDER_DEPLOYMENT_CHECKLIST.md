# Render Deployment Checklist

Use this checklist while deploying to Render.

## Prerequisites Ready ✓

- [x] GitHub Repository: https://github.com/gabtest61-sys/Sign-World
- [x] MongoDB Atlas Connection String
- [x] Google Maps API Key
- [ ] AWS S3 Credentials (needed for file uploads)

---

## Your Environment Variables

Copy these values when setting up Render:

### MongoDB Atlas (Client Account)
```
MONGODB_URI=mongodb+srv://swbpmarketing_db_user:jp37HbRDlNy7Mzc0@sign-world-prod.mhalgco.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority&appName=sign-world-prod
```
**Account:** swbpmarketing@gmail.com
**Username:** swbpmarketing_db_user
**Password:** jp37HbRDlNy7Mzc0

### Google Maps
```
GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU
```

### AWS S3 (Placeholder - file uploads won't work until you add real credentials)
```
AWS_ACCESS_KEY_ID=placeholder-key
AWS_SECRET_ACCESS_KEY=placeholder-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=placeholder-bucket
```

**Note:** With these placeholder values, the Library feature file uploads won't work. Add real AWS S3 credentials later to enable file uploads.

### OpenRouter (Optional - for AI Search)
```
OPENROUTER_API_KEY=your-openrouter-key-if-you-have-one
```

---

## Deployment Steps

### 1. Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select repository: **Sign-World**
5. Render will detect the `render.yaml` file
6. Click **"Apply"**

### 2. Configure Environment Variables

After the Blueprint creates your service, go to the service dashboard and add these environment variables:

**Required Variables:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | [Your MongoDB Atlas connection string above] |
| `JWT_SECRET` | Click "Generate" to auto-generate |
| `JWT_EXPIRE` | `7d` |
| `AWS_ACCESS_KEY_ID` | [Your AWS key] |
| `AWS_SECRET_ACCESS_KEY` | [Your AWS secret] |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET` | [Your S3 bucket name] |
| `GOOGLE_MAPS_API_KEY` | `AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU` |
| `CLIENT_URL` | `https://YOUR-SERVICE-NAME.onrender.com` |
| `VITE_API_URL` | `https://YOUR-SERVICE-NAME.onrender.com/api` |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyBOhdyerqvYuN7zvNo3Ocl72ch8RTQgFtU` |

**Optional:**
| Variable | Value |
|----------|-------|
| `OPENROUTER_API_KEY` | [If you have one] |

### 3. Update CLIENT_URL with Your Actual Service URL

After Render creates your service, you'll get a URL like:
- `https://sign-company-dashboard-xxxx.onrender.com`

Go back to Environment Variables and update:
- `CLIENT_URL` with your actual URL
- `VITE_API_URL` with your actual URL + `/api`

### 4. Wait for Deployment

- First deployment takes 5-10 minutes
- Watch the logs in the Render dashboard
- Look for: "Deploy succeeded"

### 5. Create Admin User

After deployment succeeds:

**Option 1: Via Render Shell**
1. In Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run: `node backend/scripts/resetAdmin.js`

**Option 2: Via MongoDB Atlas**
1. Go to your MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Manually insert admin user

### 6. Test Your Deployment

1. Visit your Render URL
2. Test health check: `https://your-url.onrender.com/health`
3. Test API: `https://your-url.onrender.com/api/test`
4. Login with:
   - Email: `admin@signcompany.com`
   - Password: `admin123`

---

## Troubleshooting

### Build Fails
- Check all environment variables are set
- Look at build logs in Render dashboard

### Can't Connect to Database
- Verify MongoDB Atlas connection string
- Check Network Access allows 0.0.0.0/0

### File Uploads Don't Work
- Verify AWS credentials
- Check S3 bucket permissions

---

## After Successful Deployment

- [ ] Change admin password
- [ ] Test all features
- [ ] Create test owner accounts
- [ ] Bookmark your deployment URL

---

## Your Deployment Info

**Service URL:** _____________________________________________

**Deployed:** _____________________________________________

**Admin Credentials:**
- Email: admin@signcompany.com
- Password: admin123 (CHANGE THIS!)

---

Generated: 2025-11-18
