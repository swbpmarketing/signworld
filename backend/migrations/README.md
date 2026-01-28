# Owner Migration Guide

This directory contains scripts and tools for migrating owner users from the old SignWorld app to the new dashboard.

## 🚀 Quick Start (Fastest Method)

### Step 1: Export Data from Old System

From the old SignWorld database, export owner users to CSV with these fields:

```csv
name,email,password,phone,company,street,city,state,zipCode,country,website,facebook,linkedin,instagram,yearsInBusiness,openDate,specialties,equipment,profileImage,longitude,latitude,isActive
```

**📋 Required Fields:**
- `name` - Full name of the owner
- `email` - Email address (must be unique)

**📋 Optional Fields:**
- `password` - If blank, will use default: `SignWorld2024!`
- `phone` - Phone number
- `company` - Company name
- Address fields: `street`, `city`, `state`, `zipCode`, `country`
- Social: `website`, `facebook`, `linkedin`, `instagram`
- Business info: `yearsInBusiness`, `openDate`
- `specialties` - Comma-separated (e.g., "Vehicle Wraps,Channel Letters")
- `equipment` - Comma-separated (e.g., "Roland Printer,Laminator")
- `profileImage` - URL to profile image
- `longitude`, `latitude` - For map display
- `isActive` - true/false (default: true)

### Step 2: Use the Template

See `owners-template.csv` for an example format.

### Step 3: Run the Migration Script

```bash
# From the project root directory
node backend/migrations/importOwnersFromCSV.js path/to/your/owners-export.csv
```

**Or use the npm script:**

```bash
npm run migrate:owners path/to/your/owners-export.csv
```

## 📊 What Happens During Migration

1. **CSV Validation** - Checks all records for required fields
2. **Duplicate Detection** - Skips users with existing email addresses
3. **Password Hashing** - Automatically hashes passwords securely
4. **Bulk Import** - Creates all valid users in the database
5. **Summary Report** - Shows success/failure/duplicate counts

## ⚡ Migration Options

### Option 1: CSV Import (Recommended - Fastest)
**Time:** ~5-10 minutes for 100-500 users

1. Export old database to CSV
2. Run `importOwnersFromCSV.js`
3. Done!

### Option 2: Direct Database Migration
**Time:** ~30 minutes for 100-500 users

If you have direct MongoDB access to the old system:

```javascript
// Use this script if you need to connect to old database directly
// Contact admin for implementation
```

### Option 3: Manual Import via Admin UI
**Time:** ~1-2 hours for 100-500 users

Upload CSV through the Admin Panel:
1. Go to User Management
2. Click "Import Users"
3. Upload CSV file
4. Review and confirm

## 🔧 Common Issues & Solutions

### Issue: "Missing email" errors
**Solution:** Ensure all rows have valid email addresses in the CSV

### Issue: "Duplicate email" warnings
**Solution:** These users already exist. Check if they need updating instead

### Issue: CSV parsing errors
**Solution:**
- Make sure CSV is properly formatted
- Use UTF-8 encoding
- No special characters in header row
- Comma-separated values only

### Issue: Password not working
**Solution:** Default password is `SignWorld2024!` - Users should change on first login

## 📧 Post-Migration Steps

After successful migration:

1. **Send Welcome Emails** to all new users with:
   - Login URL: `https://your-domain.com/login`
   - Default password (if used): `SignWorld2024!`
   - Instructions to change password

2. **Verify Data** in User Management page

3. **Test Login** with a few sample accounts

4. **Update Location Data** (if coordinates missing)
   - Users can update from their profile
   - Or bulk update using geocoding service

## 🎯 Advanced Options

### Custom Password Policy

Edit `importOwnersFromCSV.js` line 18:
```javascript
const DEFAULT_PASSWORD = 'YourCustomPassword123!';
```

### Skip Email Verification

Migrated users are auto-verified by default:
```javascript
emailVerified: true // Line 62
```

### Custom Role Assignment

All imports default to 'owner' role:
```javascript
role: 'owner' // Line 59
```

## 📈 Performance

| User Count | Estimated Time |
|------------|----------------|
| 1-50       | ~30 seconds    |
| 51-200     | ~2 minutes     |
| 201-500    | ~5 minutes     |
| 501-1000   | ~10 minutes    |

## 🛡️ Safety Features

- ✅ **Duplicate Prevention** - Won't create users with existing emails
- ✅ **Validation** - Checks all required fields before importing
- ✅ **Transaction Safety** - Each user import is independent
- ✅ **Rollback Ready** - Failed imports don't affect existing data
- ✅ **Audit Trail** - Detailed logs of all operations

## 📝 Example CSV Export Queries

### From MySQL:
```sql
SELECT
  CONCAT(first_name, ' ', last_name) as name,
  email,
  NULL as password,
  phone,
  company_name as company,
  street,
  city,
  state,
  zip_code as zipCode,
  country,
  website,
  facebook_url as facebook,
  linkedin_url as linkedin,
  instagram_url as instagram,
  years_in_business as yearsInBusiness,
  open_date as openDate,
  specialties,
  equipment,
  profile_image_url as profileImage,
  longitude,
  latitude,
  is_active as isActive
FROM users
WHERE role = 'owner'
INTO OUTFILE '/tmp/owners-export.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### From MongoDB:
```javascript
db.users.find({ role: 'owner' }).forEach(function(user) {
  print([
    user.name,
    user.email,
    '', // password
    user.phone || '',
    user.company || '',
    user.address?.street || '',
    user.address?.city || '',
    user.address?.state || '',
    user.address?.zipCode || '',
    user.address?.country || 'USA',
    user.socialLinks?.website || '',
    user.socialLinks?.facebook || '',
    user.socialLinks?.linkedin || '',
    user.socialLinks?.instagram || '',
    user.yearsInBusiness || '',
    user.openDate || '',
    (user.specialties || []).join(','),
    (user.equipment || []).join(','),
    user.profileImage || '',
    user.location?.coordinates[0] || '',
    user.location?.coordinates[1] || '',
    user.isActive !== false ? 'true' : 'false'
  ].join(','));
});
```

## 🆘 Support

If you encounter issues:

1. Check the error logs in the console output
2. Verify CSV format matches the template
3. Ensure MongoDB connection is working
4. Contact the development team with:
   - Error message
   - Sample of your CSV (first 5 rows)
   - Number of records being imported

## ✅ Post-Migration Checklist

- [ ] All users imported successfully
- [ ] Welcome emails sent
- [ ] Sample logins tested
- [ ] User roles verified
- [ ] Map locations displaying correctly
- [ ] Profile images loading (if provided)
- [ ] Old system can be deprecated

---

**Last Updated:** January 2026
**Migration Script Version:** 1.0.0
