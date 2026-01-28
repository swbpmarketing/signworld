const puppeteer = require('puppeteer');
const fs = require('fs');
const { Parser } = require('json2csv');

/**
 * Automated Web Scraper for Old SignWorld App
 *
 * This script logs into the old app and scrapes complete owner data.
 *
 * Usage:
 * 1. Set environment variables (or edit the script):
 *    - OLD_APP_URL (default: https://signworldowners.org/owners/)
 *    - OLD_APP_USERNAME
 *    - OLD_APP_PASSWORD
 *
 * 2. Run: node scrapeOldApp.js
 *
 * Output: owners-scraped-complete.csv
 */

// Configuration - EDIT THESE or set as environment variables
const CONFIG = {
  url: process.env.OLD_APP_URL || 'https://signworldowners.org/owners/',
  username: process.env.OLD_APP_USERNAME || '', // ⚠️ SET THIS
  password: process.env.OLD_APP_PASSWORD || '', // ⚠️ SET THIS
  headless: true, // Set to false to see browser (useful for debugging)
  timeout: 30000, // 30 seconds
};

// Selectors - ADJUST based on actual HTML structure
const SELECTORS = {
  // Login form
  usernameInput: 'input[name="log"], input[name="username"], input[type="text"]#user_login',
  passwordInput: 'input[name="pwd"], input[name="password"], input[type="password"]#user_pass',
  loginButton: 'button[type="submit"], input[type="submit"], input.button-primary, button#wp-submit',

  // After login - adjust these based on actual site structure
  ownersTable: 'table, .owners-list, #owners-table',
  ownerRows: 'tbody tr, .owner-row, .user-item',

  // Pagination
  nextButton: 'a.next, button.next, .pagination .next',
  hasNextPage: '.pagination .next:not(.disabled)',
};

// Helper function to replace deprecated page.waitForTimeout
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeOldApp = async () => {
  let browser;

  try {
    // Validate credentials
    if (!CONFIG.username || !CONFIG.password) {
      console.error('\n❌ Error: Username and password required!');
      console.log('\nSet them via:');
      console.log('  1. Environment variables:');
      console.log('     OLD_APP_USERNAME=your-email OLD_APP_PASSWORD=your-pass node scrapeOldApp.js');
      console.log('  2. Or edit this file (line 16-17)\n');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🌐 SIGNWORLD OLD APP DATA SCRAPER');
    console.log('='.repeat(70));
    console.log(`\n📍 Target URL: ${CONFIG.url}`);
    console.log(`👤 Username: ${CONFIG.username}`);
    console.log(`🔒 Password: ${'*'.repeat(CONFIG.password.length)}\n`);

    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to login page
    console.log('📄 Loading login page...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });

    // Wait a moment for page to fully load
    await delay(2000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'login-page.png' });
    console.log('   📸 Screenshot saved: login-page.png');

    // Try to find login form
    console.log('\n🔍 Looking for login form...');

    const usernameField = await page.$(SELECTORS.usernameInput);
    const passwordField = await page.$(SELECTORS.passwordInput);

    if (!usernameField || !passwordField) {
      console.error('\n❌ Could not find login form!');
      console.log('   Check login-page.png to see what the page looks like.');
      console.log('   You may need to adjust SELECTORS in this script (lines 25-37).\n');
      await browser.close();
      process.exit(1);
    }

    // Fill in credentials
    console.log('✍️  Filling in credentials...');
    await page.type(SELECTORS.usernameInput, CONFIG.username, { delay: 50 });
    await page.type(SELECTORS.passwordInput, CONFIG.password, { delay: 50 });

    // Submit login form
    console.log('🔐 Logging in...');
    await Promise.all([
      page.click(SELECTORS.loginButton),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.timeout }),
    ]);

    await delay(2000);
    await page.screenshot({ path: 'after-login.png' });
    console.log('   📸 Screenshot saved: after-login.png');

    // Check if login was successful
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Look for owners list/table
    console.log('\n📋 Looking for owners directory...');

    await delay(2000);

    // Try to find the owners table or list
    const hasTable = await page.$(SELECTORS.ownersTable);

    if (!hasTable) {
      console.log('⚠️  Could not find owners table automatically.');
      console.log('   Trying alternative approach...\n');
    }

    // Extract all text content for analysis
    console.log('🔍 Analyzing page content...');
    const pageContent = await page.evaluate(() => document.body.innerText);

    // Check if page mentions owners/users
    if (pageContent.toLowerCase().includes('owner') ||
        pageContent.toLowerCase().includes('user') ||
        pageContent.toLowerCase().includes('directory')) {
      console.log('✅ Found owner-related content on page\n');
    }

    // Scrape owner data
    console.log('🎯 Starting data extraction...\n');
    const owners = [];
    let pageNum = 1;

    do {
      console.log(`📄 Scraping page ${pageNum}...`);

      // Method 1: Try scraping from table
      const tableData = await page.evaluate((rowSelector) => {
        const rows = document.querySelectorAll(rowSelector);
        const data = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length === 0) return;

          // Extract text from each cell
          const rowData = {};
          cells.forEach((cell, index) => {
            rowData[`column_${index}`] = cell.innerText.trim();
          });

          // Try to find links (email, website, etc.)
          const links = row.querySelectorAll('a');
          links.forEach((link) => {
            const href = link.href;
            const text = link.innerText.trim();
            if (href.includes('@') || href.startsWith('mailto:')) {
              rowData.email = href.replace('mailto:', '');
            } else if (href.startsWith('http')) {
              rowData.website = href;
            }
          });

          data.push(rowData);
        });

        return data;
      }, SELECTORS.ownerRows);

      console.log(`   Found ${tableData.length} records`);
      owners.push(...tableData);

      // Method 2: Try scraping from divs/cards (if table method failed)
      if (tableData.length === 0) {
        console.log('   Trying alternative scraping method...');

        const cardData = await page.evaluate(() => {
          // Helper function to get profile image URL
          const getProfileImage = (element) => {
            // Try multiple common patterns for profile images

            // 1. Look for img with avatar/profile classes
            const img = element.querySelector('img.avatar, img.profile-image, img.user-photo, img[alt*="profile"], img[alt*="avatar"]');
            if (img && img.src) return img.src;

            // 2. Look for any img in the card
            const anyImg = element.querySelector('img');
            if (anyImg && anyImg.src && !anyImg.src.includes('icon') && !anyImg.src.includes('logo')) {
              return anyImg.src;
            }

            // 3. Look for background image in style attribute
            const divWithBg = element.querySelector('[style*="background-image"]');
            if (divWithBg) {
              const style = divWithBg.getAttribute('style');
              const match = style.match(/url\(['"]?(.*?)['"]?\)/);
              if (match) return match[1];
            }

            // 4. Look for data-src or data-avatar attributes
            const dataImg = element.querySelector('[data-src], [data-avatar], [data-profile-image]');
            if (dataImg) {
              return dataImg.getAttribute('data-src') || dataImg.getAttribute('data-avatar') || dataImg.getAttribute('data-profile-image');
            }

            return '';
          };

          // Look for common patterns
          const cards = document.querySelectorAll('.user-card, .owner-card, .member-item, .profile-item, .member, .owner, .user-profile');
          const data = [];

          cards.forEach((card) => {
            // Helper function to extract array fields (specialties, certifications, equipment)
            const extractArrayField = (selector) => {
              const elements = card.querySelectorAll(selector);
              const items = [];
              elements.forEach(el => {
                const text = el.innerText.trim();
                if (text) items.push(text);
              });
              return items.length > 0 ? items.join(',') : '';
            };

            // Helper function to extract social links
            const extractSocialLinks = () => {
              const social = {};
              const links = card.querySelectorAll('a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a.social-link');
              links.forEach(link => {
                const href = link.href;
                if (href.includes('facebook.com')) social.facebook = href;
                else if (href.includes('linkedin.com')) social.linkedin = href;
                else if (href.includes('instagram.com')) social.instagram = href;
              });
              return social;
            };

            const socialLinks = extractSocialLinks();

            const owner = {
              name: card.querySelector('.name, .user-name, .display-name, h3, h4, .full-name')?.innerText.trim() || '',
              email: card.querySelector('.email, a[href^="mailto:"]')?.innerText.trim() || '',
              phone: card.querySelector('.phone, .tel, .telephone, .contact-phone')?.innerText.trim() || '',
              company: card.querySelector('.company, .business-name, .company-name')?.innerText.trim() || '',

              // Address components (try to extract separately if possible)
              street: card.querySelector('.street, .street-address')?.innerText.trim() || '',
              city: card.querySelector('.city, .locality')?.innerText.trim() || '',
              state: card.querySelector('.state, .region')?.innerText.trim() || '',
              zipCode: card.querySelector('.zip, .postal-code, .zipcode')?.innerText.trim() || '',
              country: card.querySelector('.country')?.innerText.trim() || '',

              // If address components not found, try full address
              address: card.querySelector('.address, .location, .business-address')?.innerText.trim() || '',

              // Social links
              website: card.querySelector('a.website, a[href*="http"]:not([href*="facebook"]):not([href*="linkedin"]):not([href*="instagram"])')?.href || '',
              facebook: socialLinks.facebook || '',
              linkedin: socialLinks.linkedin || '',
              instagram: socialLinks.instagram || '',

              // Bio
              bio: card.querySelector('.bio, .about, .description, .profile-text, .user-bio')?.innerText.trim() || '',

              // Territory
              territory: card.querySelector('.territory, .service-area, .coverage-area')?.innerText.trim() || '',

              // Specialties (could be list items, tags, or comma-separated)
              specialties: extractArrayField('.specialty, .service, .specialization, .skill, .tag'),

              // Equipment
              equipment: extractArrayField('.equipment, .machine, .tool'),

              // Certifications
              certifications: extractArrayField('.certification, .cert, .certificate, .credential'),

              // Awards (could be a number or list)
              awards: card.querySelector('.awards, .award-count, .achievements')?.innerText.trim() || '',

              // Years in business / Open date
              yearsInBusiness: card.querySelector('.years-in-business, .experience-years, .years')?.innerText.trim() || '',
              openDate: card.querySelector('.established, .founded, .since, .open-date')?.innerText.trim() || '',

              // Location coordinates
              longitude: card.getAttribute('data-lng') || card.getAttribute('data-longitude') || '',
              latitude: card.getAttribute('data-lat') || card.getAttribute('data-latitude') || '',

              // Profile image
              profileImage: getProfileImage(card),
            };

            if (owner.name || owner.email) {
              data.push(owner);
            }
          });

          return data;
        });

        console.log(`   Found ${cardData.length} records via alternative method`);
        owners.push(...cardData);
      }

      // Check for next page
      const hasNext = await page.$(SELECTORS.hasNextPage);
      if (hasNext) {
        console.log('   → Moving to next page...');
        await page.click(SELECTORS.nextButton);
        await delay(2000);
        pageNum++;
      } else {
        break;
      }

    } while (pageNum < 100); // Safety limit

    console.log(`\n✅ Scraping complete! Found ${owners.length} total records\n`);

    if (owners.length === 0) {
      console.log('⚠️  No data extracted!');
      console.log('\n📝 Manual intervention needed:');
      console.log('   1. Check after-login.png to see the logged-in page');
      console.log('   2. Update SELECTORS in this script to match actual HTML');
      console.log('   3. Or manually export data from the old app\n');
      await browser.close();
      process.exit(1);
    }

    // Display sample data
    console.log('─'.repeat(70));
    console.log('📋 SAMPLE DATA (first 3 records):');
    console.log('─'.repeat(70));
    owners.slice(0, 3).forEach((owner, i) => {
      console.log(`\n${i + 1}.`, JSON.stringify(owner, null, 2));
    });

    // Convert to CSV
    console.log('\n📝 Converting to CSV...');

    // Determine fields from data
    const allFields = new Set();
    owners.forEach(owner => {
      Object.keys(owner).forEach(key => allFields.add(key));
    });

    const parser = new Parser({ fields: Array.from(allFields) });
    const csv = parser.parse(owners);

    // Save to file
    const outputFile = 'owners-scraped-complete.csv';
    fs.writeFileSync(outputFile, csv);

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(70));
    console.log(`\n📄 File created: ${outputFile}`);
    console.log(`📊 Total records: ${owners.length}`);
    console.log(`📑 Fields extracted: ${allFields.size}`);

    console.log('\n📝 Next steps:');
    console.log('   1. Review the CSV file to ensure data looks correct');
    console.log('   2. Map columns to match expected format (if needed)');
    console.log('   3. Run: npm run migrate:validate ' + outputFile);
    console.log('   4. Run: npm run migrate:owners ' + outputFile);
    console.log('\n' + '='.repeat(70) + '\n');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error('\nFull error:', error);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
};

// Run the scraper
console.log('\n⚠️  IMPORTANT:');
console.log('   This script will open a browser and login to the old app.');
console.log('   Make sure you have proper authorization to access this data.\n');

scrapeOldApp();
