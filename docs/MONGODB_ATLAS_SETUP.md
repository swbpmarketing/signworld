# MongoDB Atlas Setup Guide

This guide will walk you through setting up a MongoDB Atlas database for the Sign Company Dashboard.

## What is MongoDB Atlas?

MongoDB Atlas is a cloud-hosted MongoDB database service. It's required for deploying your application to Render because Render can't access your local MongoDB database.

**Free Tier:** MongoDB offers a free M0 cluster with 512MB storage - perfect for development and small production apps.

---

## Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)

2. Sign up with:
   - Email and password, OR
   - Google account, OR
   - GitHub account

3. Fill out the welcome questionnaire (optional - you can skip most questions)

4. Choose the **FREE** plan (M0 Sandbox)

---

### Step 2: Create a Cluster

1. After signing up, you'll see "Create a deployment" or "Build a Database"

2. Click **"Build a Database"** or **"Create"**

3. Choose deployment option:
   - Select **"M0 FREE"** (should be selected by default)
   - Do NOT choose M10 or higher (those are paid)

4. Choose cloud provider and region:
   - **Provider:** AWS (recommended) or Google Cloud or Azure
   - **Region:** Choose closest to your users
     - For US: `us-east-1` (N. Virginia) - recommended
     - For Europe: `eu-west-1` (Ireland)
     - For Asia: `ap-southeast-1` (Singapore)

5. Cluster name:
   - Default name is fine (usually "Cluster0")
   - Or rename to: `sign-company-cluster`

6. Click **"Create Deployment"** or **"Create Cluster"**

7. Wait 1-3 minutes for cluster to be created

---

### Step 3: Create Database User

You'll see a security quickstart screen:

1. **Username:** Enter a username
   - Recommended: `signcompany` or `admin`
   - Write this down!

2. **Password:**
   - Click **"Autogenerate Secure Password"** (recommended)
   - OR create your own strong password
   - **IMPORTANT:** Click "Copy" and save this password somewhere safe!
   - You'll need this for the connection string

3. **User Privileges:** Leave as default ("Read and write to any database")

4. Click **"Create User"**

**Example credentials:**
```
Username: signcompany
Password: Xy9mK2pL4nQ8rT6v (auto-generated example)
```

---

### Step 4: Set Up Network Access

Still on the security quickstart screen:

1. **IP Access List:**
   - You'll see "Where would you like to connect from?"

2. **For Render Deployment:**
   - Click **"Add My Current IP Address"** (for testing from your computer)
   - Then click **"Add a Different IP Address"**
   - Enter: `0.0.0.0/0`
   - Description: `Allow from anywhere`
   - Click **"Add Entry"**

   **Why 0.0.0.0/0?** This allows connections from any IP address (required for Render). Your database is still secure because you need the username and password to connect.

3. Click **"Finish and Close"** or **"Close"**

---

### Step 5: Get Your Connection String

1. On the MongoDB Atlas dashboard, click **"Connect"** (or "CONNECT" button)

2. Choose connection method:
   - Click **"Drivers"** (not Compass or Shell)

3. Select your driver and version:
   - **Driver:** Node.js
   - **Version:** 4.1 or later (doesn't matter much)

4. Copy the connection string:
   - You'll see something like:
   ```
   mongodb+srv://signcompany:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. **Modify the connection string:**
   - Replace `<password>` with your actual password from Step 3
   - Add the database name before the `?`
   - Example:

   **Before:**
   ```
   mongodb+srv://signcompany:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   **After:**
   ```
   mongodb+srv://signcompany:Xy9mK2pL4nQ8rT6v@cluster0.xxxxx.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority
   ```

6. **Save this connection string!** You'll need it for:
   - Your `.env` file (local testing)
   - Render environment variables (production)

---

### Step 6: Test the Connection (Optional but Recommended)

Test your connection string locally before deploying:

1. **Update your local .env file:**
   ```env
   MONGODB_URI=mongodb+srv://signcompany:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority
   ```

2. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

3. **Check the logs:**
   - You should see: "MongoDB Connected"
   - If you see connection errors, check:
     - Password is correct (no < > brackets)
     - IP address 0.0.0.0/0 is whitelisted
     - Database name is included in the URI

4. **Test by logging in:**
   - Go to http://localhost:5173
   - Try logging in with admin credentials
   - If it works, your MongoDB Atlas is configured correctly!

---

## Connection String Format Explained

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.xxxxx.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

- `mongodb+srv://` - Protocol (SRV record for Atlas)
- `USERNAME` - Database user (e.g., signcompany)
- `PASSWORD` - Database password (URL-encoded)
- `CLUSTER.xxxxx.mongodb.net` - Your cluster address
- `DATABASE_NAME` - Your database name (e.g., sign-company-dashboard)
- `?retryWrites=true&w=majority` - Connection options

---

## Important Notes

### Password Special Characters

If your password contains special characters, you need to URL-encode them:

| Character | URL Encoded |
|-----------|-------------|
| @ | %40 |
| : | %3A |
| / | %2F |
| ? | %3F |
| # | %23 |
| [ | %5B |
| ] | %5D |

**Example:**
- Password: `P@ss:word/123`
- Encoded: `P%40ss%3Aword%2F123`

**Tip:** Use the auto-generated password to avoid this issue!

---

## Common Issues & Solutions

### Issue 1: "Authentication failed"

**Solution:**
- Double-check username and password
- Ensure password is URL-encoded if it has special characters
- Make sure you created a database user (not just an Atlas account user)

### Issue 2: "Connection timeout" or "Could not connect"

**Solution:**
- Check Network Access settings
- Ensure `0.0.0.0/0` is whitelisted
- Wait a few minutes after adding IP (can take 2-3 minutes to apply)

### Issue 3: "Database not found"

**Solution:**
- Add database name to connection string before the `?`
- MongoDB will auto-create the database on first connection

### Issue 4: "Too many connection requests"

**Solution:**
- Free tier has connection limits
- Make sure you're not running multiple instances of your app
- Close old connections properly

---

## Using MongoDB Atlas Dashboard

After setup, you can use the Atlas dashboard to:

### View Your Data

1. Click **"Browse Collections"** or **"Collections"**
2. Select your database: `sign-company-dashboard`
3. View collections: `users`, `events`, `brags`, etc.
4. Click any collection to see documents

### Monitor Usage

1. Click **"Metrics"** tab
2. View:
   - Connections
   - Operations per second
   - Storage size
   - Network traffic

### Backup & Restore

Free tier includes:
- Automatic backups (retained for 2 days)
- Point-in-time recovery (paid feature)

To download a backup:
1. **NOT AVAILABLE ON FREE TIER**
2. Use `mongodump` manually if needed

---

## Free Tier Limitations

MongoDB Atlas M0 (Free) includes:

**Included:**
- ✓ 512 MB storage
- ✓ Shared RAM
- ✓ Shared vCPU
- ✓ 100 max connections
- ✓ Basic monitoring

**Not Included:**
- ✗ Continuous backups
- ✗ Advanced monitoring
- ✗ Auto-scaling
- ✗ Premium support

**Limits:**
- Storage: 512 MB
- Max connections: 100 concurrent
- Bandwidth: Shared

**For most small apps, this is plenty!**

---

## Upgrading (Optional)

If you need more resources:

1. Go to your cluster
2. Click **"Edit Configuration"** or **"Upgrade"**
3. Choose **M2** ($9/month) or **M10** ($57/month)
4. Benefits:
   - More storage (2GB - 40GB)
   - Dedicated RAM and CPU
   - Automated backups
   - Better performance

**For Sign Company Dashboard, M0 free tier should work fine for development and small production use.**

---

## Security Best Practices

1. **Strong passwords**
   - Use auto-generated passwords
   - Store securely (password manager)

2. **Limit IP access**
   - For production: Only allow Render IPs if possible
   - For development: Your IP + 0.0.0.0/0

3. **Separate databases**
   - Development: `sign-company-dashboard-dev`
   - Production: `sign-company-dashboard`

4. **Regular backups**
   - Export data regularly
   - Use `mongodump` for backups

5. **Monitor access**
   - Check "Access Manager" regularly
   - Review connection logs

---

## Next Steps

After MongoDB Atlas is set up:

1. ✓ You have your connection string
2. → Add it to Render environment variables
3. → Continue with Render deployment (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))

---

## Quick Reference

**Your MongoDB Atlas Credentials:**
```
Cluster Name: cluster0 (or your custom name)
Username: signcompany (or your username)
Password: [your password]
Connection String: mongodb+srv://signcompany:PASSWORD@cluster0.xxxxx.mongodb.net/sign-company-dashboard?retryWrites=true&w=majority
```

**Important Links:**
- MongoDB Atlas Dashboard: https://cloud.mongodb.com
- Documentation: https://docs.atlas.mongodb.com/
- Connection Troubleshooting: https://docs.atlas.mongodb.com/troubleshoot-connection/

---

## Support

If you encounter issues:
- MongoDB Atlas Support: https://support.mongodb.com
- Community Forums: https://www.mongodb.com/community/forums/
- Documentation: https://docs.atlas.mongodb.com/

---

Generated: 2025-11-18
