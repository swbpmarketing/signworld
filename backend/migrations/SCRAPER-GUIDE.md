# Automated Web Scraper Guide

Extract complete owner data from the old app automatically!

---

## 🚀 Quick Start

### **Method 1: Set Credentials as Environment Variables** (Recommended)

```bash
# Windows (Command Prompt)
set OLD_APP_USERNAME=your-email@example.com
set OLD_APP_PASSWORD=your-password
npm run migrate:scrape

# Windows (PowerShell)
$env:OLD_APP_USERNAME="your-email@example.com"
$env:OLD_APP_PASSWORD="your-password"
npm run migrate:scrape

# Mac/Linux
OLD_APP_USERNAME=your-email@example.com OLD_APP_PASSWORD=your-password npm run migrate:scrape
```

### **Method 2: Edit the Script Directly**

1. Open `backend/migrations/scrapeOldApp.js`
2. Find lines 16-17:
   ```javascript
   username: process.env.OLD_APP_USERNAME || '', // ⚠️ SET THIS
   password: process.env.OLD_APP_PASSWORD || '', // ⚠️ SET THIS
   ```
3. Replace with your credentials:
   ```javascript
   username: process.env.OLD_APP_USERNAME || 'your-email@example.com',
   password: process.env.OLD_APP_PASSWORD || 'your-password',
   ```
4. Run:
   ```bash
   npm run migrate:scrape
   ```

---

## 🎬 What Happens

1. **Opens Browser** - Launches Chrome/Chromium (headless by default)
2. **Logs In** - Navigates to https://signworldowners.org/owners/ and logs in
3. **Finds Data** - Locates the owners directory/table
4. **Extracts Everything** - Scrapes all owner information
5. **Handles Pagination** - Automatically goes through all pages
6. **Saves to CSV** - Creates `owners-scraped-complete.csv`

---

## 📊 Output

After running, you'll get:

```
owners-scraped-complete.csv
```

This file contains **complete** owner data with all fields from the old app!

---

## 🔍 Debugging

If the scraper doesn't work on first try:

### **1. See What's Happening**

Edit `scrapeOldApp.js` line 18:
```javascript
headless: false, // Was: true
```

This shows the browser so you can see what's happening.

### **2. Check Screenshots**

The script saves screenshots:
- `login-page.png` - What the login page looks like
- `after-login.png` - Page after logging in

Use these to verify:
- ✅ Login page loaded correctly
- ✅ Login was successful
- ✅ Owners data is visible

### **3. Adjust Selectors**

If the script can't find the login form or data table, you may need to adjust the selectors in `scrapeOldApp.js` (lines 25-37).

**How to find correct selectors:**
1. Open https://signworldowners.org/owners/ in Chrome
2. Log in manually
3. Right-click on the username field → Inspect
4. Look for the `name` or `id` attribute
5. Update line 26 in the script

Example:
```javascript
// If username field is: <input name="user_login">
usernameInput: 'input[name="user_login"]',

// If it's: <input id="username">
usernameInput: '#username',
```

---

## ✅ After Scraping

Once you have `owners-scraped-complete.csv`:

```bash
# 1. Review the data
# Open the CSV in Excel/Google Sheets

# 2. Validate it
npm run migrate:analyze owners-scraped-complete.csv

# 3. Check for errors
npm run migrate:validate owners-scraped-complete.csv

# 4. Import it!
npm run migrate:owners owners-scraped-complete.csv
```

---

## 🔒 Security Notes

- ✅ **Use environment variables** for credentials (Method 1)
- ⚠️ **Never commit** the script with hardcoded passwords
- ⚠️ **Delete credentials** from script after scraping
- ✅ **Run locally** on your machine (not on a server)

---

## 🆘 Common Issues

### "Could not find login form"
**Fix:** Adjust selectors (lines 26-27) to match actual HTML

### "No data extracted"
**Fix:**
1. Set `headless: false` to see the page
2. Check `after-login.png` screenshot
3. Adjust `SELECTORS.ownersTable` and `SELECTORS.ownerRows`

### "Login failed"
**Fix:**
- Verify credentials are correct
- Check if the old app requires 2FA
- Try logging in manually first to ensure account works

### Scraper is too slow
**Fix:** Adjust timeout on line 19:
```javascript
timeout: 30000, // Increase if needed (in milliseconds)
```

---

## 💡 Pro Tips

1. **Test with headless: false first** to see what's happening
2. **Check the screenshots** if something goes wrong
3. **The script stops at 100 pages** - adjust line 201 if you have more
4. **It automatically handles pagination** - no manual clicking needed
5. **CSV columns might need mapping** - that's okay, just match them to the template format

---

## 📈 Comparison: Scraping vs Manual Export

| Method | Time | Completeness | Effort |
|--------|------|--------------|--------|
| **Web Scraper** | 2-5 min | 100% | Low - Run script |
| Incomplete CSV | 0 min | 50-70% | None - Already have it |
| Manual Copy | 2-4 hours | 100% | High - Copy all data |
| DB Export | Varies | 100% | Medium - Need DB access |

**Recommendation:** Try the scraper! It's automated and gets everything.

---

## 🎯 Success Checklist

- [ ] Puppeteer installed (`npm install`)
- [ ] Credentials set (environment variables or in script)
- [ ] Script runs without errors
- [ ] `owners-scraped-complete.csv` created
- [ ] CSV contains owner data
- [ ] Data looks correct (review in Excel)
- [ ] Ready to validate and import

---

**Need Help?**

1. Check the screenshots (`login-page.png`, `after-login.png`)
2. Run with `headless: false` to watch it work
3. Review error messages carefully
4. Check SELECTORS match the actual HTML

**Still stuck?** You can always import the incomplete CSV you already have!
