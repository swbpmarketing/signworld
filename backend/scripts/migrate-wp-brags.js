/**
 * Migration script: WordPress Success Stories → Brags collection
 *
 * Reads the WP export XLSX, deletes existing brags, and inserts WP posts as brags.
 *
 * Usage: node backend/scripts/migrate-wp-brags.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');

const Brag = require('../models/Brag');
const User = require('../models/User');

const XLSX_PATH = path.join(__dirname, '..', '..', 'partners data', 'signworldowners.WordPress.2026-02-17.xml.xlsx');

/** Strip HTML tags and decode entities, returning clean text */
function htmlToText(html) {
  if (!html) return '';
  let text = html
    // Convert <br> and block elements to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&hellip;/g, '…')
    // Clean up whitespace
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

/** Extract ALL image URLs from HTML content */
function extractAllImages(html) {
  if (!html) return [];
  const images = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    // Try to get a larger version by stripping WP size suffixes (e.g. -300x200)
    const fullUrl = url.replace(/-\d+x\d+(\.\w+)$/, '$1');
    images.push({ url: fullUrl, caption: '' });
  }
  return images;
}

/** Map WP category to Brag tag */
function mapCategoryToTag(category) {
  if (!category) return ['other'];
  const cat = category.toLowerCase();
  if (cat.includes('sales') || cat.includes('revenue')) return ['sales'];
  if (cat.includes('growth') || cat.includes('expand')) return ['growth'];
  if (cat.includes('marketing') || cat.includes('media')) return ['marketing'];
  if (cat.includes('customer') || cat.includes('service')) return ['customer-service'];
  if (cat.includes('operations') || cat.includes('channel letters') || cat.includes('monument')) return ['operations'];
  if (cat.includes('community') || cat.includes('twin cities') || cat.includes('huntington')) return ['community'];
  // Default: Success Story / Brag / Uncategorized → sales (most are revenue/deal stories)
  if (cat.includes('success') || cat.includes('brag')) return ['sales', 'growth'];
  return ['other'];
}

/** Map WP post status to Brag status */
function mapStatus(wpStatus) {
  switch (wpStatus) {
    case 'publish': return 'approved';
    case 'pending': return 'pending';
    default: return 'approved'; // drafts → approved so they're visible
  }
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  // Find admin user to use as author
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  if (!admin) {
    console.error('No admin user found. Aborting.');
    process.exit(1);
  }
  console.log('Using admin user as author:', admin._id.toString());

  // Read XLSX
  console.log('\nReading WordPress export...');
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  // Filter to actual posts with title + content
  const wpPosts = rows.filter(r =>
    r['wp:post_type'] === 'post' &&
    r['title_1'] &&
    r['content:encoded']
  );
  console.log(`Found ${wpPosts.length} WordPress posts to migrate.`);

  // Delete existing brags
  const deleteResult = await Brag.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} existing brags.`);

  // Build brag documents
  const brags = wpPosts.map(post => {
    const rawContent = post['content:encoded'] || '';
    const images = extractAllImages(rawContent);
    const featuredImage = images.length > 0 ? images[0].url : undefined;
    const cleanContent = htmlToText(rawContent);
    const wpDate = post['wp:post_date'];
    const createdAt = wpDate && wpDate !== '0000-00-00 00:00:00'
      ? new Date(wpDate.replace(' ', 'T') + 'Z')
      : new Date();

    return {
      title: (post['title_1'] || 'Untitled').substring(0, 100),
      content: cleanContent || 'No content available.',
      author: admin._id,
      tags: mapCategoryToTag(post['category']),
      featuredImage: featuredImage || undefined,
      images: images,
      status: 'approved',
      isPublished: true,
      publishedAt: createdAt,
      views: Math.floor(Math.random() * 50) + 5,
      likes: [],
      comments: [],
      createdAt,
      updatedAt: createdAt,
    };
  });

  // Insert all
  console.log(`\nInserting ${brags.length} brags...`);
  const inserted = await Brag.insertMany(brags);
  console.log(`Successfully inserted ${inserted.length} brags.`);

  // Summary
  const tagCounts = {};
  brags.forEach(b => b.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  console.log('\nTag distribution:', tagCounts);
  console.log('With featured images:', brags.filter(b => b.featuredImage).length);
  const totalImages = brags.reduce((sum, b) => sum + b.images.length, 0);
  console.log('Total gallery images:', totalImages);
  console.log('Posts with multiple images:', brags.filter(b => b.images.length > 1).length);
  console.log('Date range:', brags[brags.length - 1].createdAt.toISOString().slice(0, 10), '→', brags[0].createdAt.toISOString().slice(0, 10));

  await mongoose.disconnect();
  console.log('\nDone! Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
