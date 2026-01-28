# GoHighLevel Migration Workflow

**Complete workflow for migrating users WITHOUT sending automatic emails.**

Your team handles all email communication via GoHighLevel. ✅

---

## 🎯 **Complete Workflow**

### **Step 1: Migrate Users to Database (Silent)**

```bash
# Option A: Scrape old app (if you have login credentials)
npm run migrate:scrape
npm run migrate:owners owners-scraped-complete.csv

# Option B: Use existing CSV
npm run migrate:owners your-existing-file.csv
```

**Result:** Users are now in your database, but **NO emails sent**. ✅

---

### **Step 2: Export Users for GoHighLevel**

After users are imported, export them for GoHighLevel:

```bash
npm run migrate:export-ghl
```

**Output:** `gohighlevel-users-export.csv`

**This CSV includes:**
- ✅ Name (First, Last, Full)
- ✅ Email
- ✅ Phone
- ✅ Company
- ✅ Full Address (formatted)
- ✅ Social Links (Website, Facebook, LinkedIn, Instagram)
- ✅ Login URL
- ✅ Default Password
- ✅ Custom tags (Source: "SignWorld Migration")

---

### **Step 3: Upload to GoHighLevel**

1. **Login to GoHighLevel**
2. **Go to:** Contacts → Import
3. **Upload:** `gohighlevel-users-export.csv`
4. **Map fields:**
   - First Name → First Name
   - Last Name → Last Name
   - Email → Email
   - Phone → Phone
   - Company → Company Name
   - Login URL → Custom Field
   - Default Password → Custom Field
   - etc.

---

### **Step 4: Create Welcome Email Campaign**

In GoHighLevel, create your welcome email:

**Subject:** Welcome to the New SignWorld Dashboard!

**Body:**
```
Hi {{First Name}},

Your account has been migrated to our new dashboard!

🔗 Login here: {{Login URL}}
📧 Email: {{Email}}
🔑 Temporary Password: {{Default Password}}

⚠️ PLEASE DO:
1. Login and change your password immediately
2. Complete your profile
3. Update your business information

Questions? Reply to this email.

Welcome aboard!
The SignWorld Team
```

---

### **Step 5: Send from GoHighLevel**

Use GoHighLevel's campaign features:
- ✅ Bulk email all migrated users
- ✅ Track open rates
- ✅ Track click rates
- ✅ Follow-up sequences
- ✅ Automated reminders

---

## 📊 **What Gets Exported**

The `gohighlevel-users-export.csv` includes these columns:

| Column | Description | Example |
|--------|-------------|---------|
| First Name | First name | John |
| Last Name | Last name | Smith |
| Full Name | Complete name | John Smith |
| Email | Email address | john@signworld.com |
| Phone | Phone number | 555-123-4567 |
| Company | Business name | SignWorld Dallas |
| Street | Street address | 123 Main St |
| City | City | Dallas |
| State | State | TX |
| Zip Code | Zip code | 75201 |
| Country | Country | USA |
| Full Address | Formatted address | 123 Main St, Dallas, TX 75201 |
| Website | Website URL | https://signworlddallas.com |
| Facebook | Facebook URL | https://facebook.com/... |
| LinkedIn | LinkedIn URL | https://linkedin.com/... |
| Instagram | Instagram URL | https://instagram.com/... |
| Login URL | Dashboard login URL | https://your-domain.com/login |
| Default Password | Temp password | SignWorld2024! |
| Created Date | Account created date | 1/26/2026 |
| Status | Migration status | Migrated |
| Source | Migration source | SignWorld Migration |

---

## 🔒 **Security: No Automatic Emails**

✅ **Confirmed - Migration scripts do NOT send emails:**

| Script | What It Does | Sends Email? |
|--------|--------------|--------------|
| `migrate:scrape` | Scrapes old app | ❌ No |
| `migrate:owners` | Imports to database | ❌ No |
| `migrate:export-ghl` | Exports to CSV | ❌ No |

**Only GoHighLevel sends emails** - when YOU decide. ✅

---

## 💡 **GoHighLevel Email Template Variables**

Use these in your GoHighLevel templates:

```
{{First Name}}
{{Last Name}}
{{Full Name}}
{{Email}}
{{Phone}}
{{Company}}
{{Full Address}}
{{City}}, {{State}} {{Zip Code}}
{{Website}}
{{Login URL}}
{{Default Password}}
```

---

## 🎯 **Complete Migration Checklist**

- [ ] Run migration (users imported to database)
- [ ] Export users: `npm run migrate:export-ghl`
- [ ] Upload CSV to GoHighLevel
- [ ] Map fields in GoHighLevel
- [ ] Create welcome email template
- [ ] Test email with 1-2 users first
- [ ] Review and adjust template
- [ ] Send bulk campaign to all users
- [ ] Monitor email delivery/opens
- [ ] Send follow-up reminders (via GHL automation)

---

## 🔄 **Re-Running Export**

If you import more users later, just re-export:

```bash
npm run migrate:export-ghl
```

This exports ALL active owner users. You can filter in GoHighLevel by:
- Created Date (to find new users)
- Status tag
- Source tag

---

## 📈 **Advantages of GoHighLevel Approach**

✅ **Professional email delivery**
✅ **Track opens and clicks**
✅ **Automated follow-ups**
✅ **SMS capabilities**
✅ **Segmentation options**
✅ **A/B testing**
✅ **Better deliverability**
✅ **Centralized communication**

---

## 🆘 **Common Questions**

### Q: Will users get automatic emails when I run migrate:owners?
**A:** No! The script only creates accounts in the database. Zero emails sent.

### Q: Can I export users multiple times?
**A:** Yes! Run `npm run migrate:export-ghl` anytime to get updated CSV.

### Q: What if I import more users later?
**A:** Re-export and upload to GoHighLevel. It will handle duplicates.

### Q: Can I customize the CSV columns?
**A:** Yes! Edit `exportForGoHighLevel.js` to add/remove fields.

---

## 🚀 **Quick Start**

```bash
# 1. Import users (silent - no emails)
npm run migrate:owners your-file.csv

# 2. Export for GoHighLevel
npm run migrate:export-ghl

# 3. Upload gohighlevel-users-export.csv to GoHighLevel
# 4. Send welcome emails from GoHighLevel
```

**That's it!** ✅

---

**Your team controls ALL email communication through GoHighLevel.** 🎯
