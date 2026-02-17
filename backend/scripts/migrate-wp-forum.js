/**
 * Migration script: WordPress bbPress Forum → ForumThread collection
 *
 * Parses WP export XML files for topics, replies, and users.
 * Maps bbPress forums to app categories and WP authors to DB users.
 *
 * Required files in "partners data/":
 *   signworldowners.WordPress.2026-02-17 (3).xml — Replies
 *   signworldowners.WordPress.2026-02-17 (4).xml — Users
 *   signworldowners.WordPress.2026-02-17 (5).xml — Topics
 *
 * Usage: node backend/scripts/migrate-wp-forum.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const sax = require('sax');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const ForumThread = require('../models/ForumThread');
const User = require('../models/User');

const DATA_DIR = path.join(__dirname, '..', '..', 'partners data');
const USERS_XML  = path.join(DATA_DIR, 'signworldowners.WordPress.2026-02-17 (4).xml');
const TOPICS_XML = path.join(DATA_DIR, 'signworldowners.WordPress.2026-02-17 (5).xml');
const REPLIES_XML = path.join(DATA_DIR, 'signworldowners.WordPress.2026-02-17 (3).xml');

/** bbPress forum ID → ForumThread category */
const FORUM_CATEGORY_MAP = {
  '314592': 'suppliers',   // Where do I buy?
  '314588': 'suppliers',   // Where do I buy? (parent)
  '314593': 'help',        // How do I do?
  '314589': 'help',        // How do I do? (parent)
  '314594': 'general',     // How do I Price?
  '314590': 'general',     // How do I Price? (parent)
  '314595': 'marketing',   // Logos/Fonts/Template Requests
  '314591': 'marketing',   // Logos/Fonts/Template Requests (parent)
  '314597': 'operations',  // Productivity/Efficiency Ideas
  '314596': 'operations',  // Productivity/Efficiency Ideas (parent)
  '314587': 'general',     // Archives
  '314586': 'general',     // Archives (parent)
  '357751': 'technical',   // Technical
  '357750': 'technical',   // Technical (parent)
  '374658': 'technical',   // Technology
  '374657': 'technical',   // Technology (parent)
};

/** Strip HTML tags and decode entities */
function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
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
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract image URLs from HTML */
function extractImages(html) {
  if (!html) return [];
  const images = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1].replace(/-\d+x\d+(\.\w+)$/, '$1');
    images.push(url);
  }
  return images;
}

/**
 * Stream-parse a WXR XML file, extracting <wp:author> and <item> blocks.
 * Uses SAX in non-strict mode (tag names uppercased).
 */
function parseWxrXml(filePath) {
  return new Promise((resolve, reject) => {
    const items = [];
    const authors = [];
    let currentItem = null;
    let currentMeta = null;
    let currentAuthor = null;
    let inAuthor = false;
    let currentText = '';
    let catDomain = null;

    const parser = sax.createStream(false, { trim: false });

    parser.on('opentag', (node) => {
      currentText = '';

      if (node.name === 'ITEM') {
        currentItem = { meta: {}, tags: [] };
      } else if (node.name === 'WP:AUTHOR') {
        inAuthor = true;
        currentAuthor = {};
      } else if (node.name === 'WP:POSTMETA' && currentItem) {
        currentMeta = {};
      } else if (node.name === 'CATEGORY' && currentItem) {
        catDomain = node.attributes.DOMAIN || null;
      }
    });

    parser.on('text', (t) => { currentText += t; });
    parser.on('cdata', (c) => { currentText += c; });

    parser.on('closetag', (tag) => {
      const text = currentText;

      // ── Author block ──
      if (inAuthor) {
        switch (tag) {
          case 'WP:AUTHOR_LOGIN': currentAuthor.login = text.trim(); break;
          case 'WP:AUTHOR_EMAIL': currentAuthor.email = text.trim(); break;
          case 'WP:AUTHOR_DISPLAY_NAME': currentAuthor.displayName = text.trim(); break;
          case 'WP:AUTHOR_FIRST_NAME': currentAuthor.firstName = text.trim(); break;
          case 'WP:AUTHOR_LAST_NAME': currentAuthor.lastName = text.trim(); break;
          case 'WP:AUTHOR_ID': currentAuthor.id = text.trim(); break;
          case 'WP:AUTHOR':
            inAuthor = false;
            if (currentAuthor.login) authors.push(currentAuthor);
            currentAuthor = null;
            break;
        }
      }

      // ── Item block ──
      if (currentItem) {
        if (currentMeta) {
          switch (tag) {
            case 'WP:META_KEY': currentMeta.key = text.trim(); break;
            case 'WP:META_VALUE': currentMeta.value = text.trim(); break;
            case 'WP:POSTMETA':
              if (currentMeta.key) currentItem.meta[currentMeta.key] = currentMeta.value || '';
              currentMeta = null;
              break;
          }
        } else {
          switch (tag) {
            case 'TITLE': currentItem.title = text.trim(); break;
            case 'DC:CREATOR': currentItem.creator = text.trim(); break;
            case 'CONTENT:ENCODED': currentItem.content = text; break;
            case 'WP:POST_ID': currentItem.postId = text.trim(); break;
            case 'WP:POST_DATE': currentItem.postDate = text.trim(); break;
            case 'WP:STATUS': currentItem.status = text.trim(); break;
            case 'WP:POST_PARENT': currentItem.postParent = text.trim(); break;
            case 'WP:POST_TYPE': currentItem.postType = text.trim(); break;
            case 'WP:MENU_ORDER': currentItem.menuOrder = text.trim(); break;
            case 'WP:IS_STICKY': currentItem.isSticky = text.trim(); break;
            case 'WP:ATTACHMENT_URL': currentItem.attachmentUrl = text.trim(); break;
            case 'CATEGORY':
              if (catDomain === 'topic-tag' && text.trim()) {
                currentItem.tags.push(text.trim());
              }
              catDomain = null;
              break;
            case 'ITEM':
              items.push(currentItem);
              currentItem = null;
              break;
          }
        }
      }

      currentText = '';
    });

    parser.on('error', () => { parser.resume(); });

    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    stream.pipe(parser);
    stream.on('error', reject);
    parser.on('end', () => resolve({ items, authors }));
  });
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  // ── 1. Parse users XML for author mapping ──
  console.log('Parsing users XML...');
  const { authors } = await parseWxrXml(USERS_XML);
  console.log(`  Found ${authors.length} WP authors.`);

  const loginToAuthor = {};
  for (const a of authors) {
    if (a.login && a.email) {
      loginToAuthor[a.login] = {
        email: a.email.toLowerCase(),
        name: a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login,
      };
    }
  }

  // Find admin fallback
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  if (!admin) { console.error('No admin user found!'); process.exit(1); }
  console.log(`  Admin fallback: ${admin._id}`);

  // Resolve WP logins → DB user IDs (find or create)
  const defaultPassword = await bcrypt.hash('SignworldMigrated2026!', 10);
  const loginToUserId = {};
  let usersCreated = 0;

  for (const [login, info] of Object.entries(loginToAuthor)) {
    let dbUser = await User.findOne({
      email: { $regex: new RegExp(`^${info.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).select('_id');

    if (!dbUser) {
      dbUser = await User.create({
        name: info.name,
        email: info.email,
        password: defaultPassword,
        role: 'owner',
        isApproved: true,
      });
      usersCreated++;
    }
    loginToUserId[login] = dbUser._id;
  }
  console.log(`  Resolved ${Object.keys(loginToUserId).length} users (${usersCreated} newly created).\n`);

  // ── 2. Parse topics XML ──
  console.log('Parsing topics XML (63 MB, please wait)...');
  const topicsResult = await parseWxrXml(TOPICS_XML);
  const topicItems = topicsResult.items.filter(i => i.postType === 'topic' && i.status === 'publish');
  console.log(`  Found ${topicItems.length} published topics (${topicsResult.items.length} total items).`);

  // Collect attachment URLs by parent post ID
  const attachmentsByParent = {};
  for (const item of topicsResult.items) {
    if (item.postType === 'attachment' && item.attachmentUrl) {
      const parent = item.postParent || '';
      if (!attachmentsByParent[parent]) attachmentsByParent[parent] = [];
      attachmentsByParent[parent].push(item.attachmentUrl);
    }
  }

  // ── 3. Parse replies XML ──
  console.log('Parsing replies XML (88 MB, please wait)...');
  const repliesResult = await parseWxrXml(REPLIES_XML);
  const replyItems = repliesResult.items.filter(i => i.postType === 'reply' && i.status === 'publish');
  console.log(`  Found ${replyItems.length} published replies (${repliesResult.items.length} total items).`);

  // Collect reply attachments too
  for (const item of repliesResult.items) {
    if (item.postType === 'attachment' && item.attachmentUrl) {
      const parent = item.postParent || '';
      if (!attachmentsByParent[parent]) attachmentsByParent[parent] = [];
      attachmentsByParent[parent].push(item.attachmentUrl);
    }
  }

  // Group replies by topic ID
  const repliesByTopic = {};
  for (const reply of replyItems) {
    const topicId = reply.meta['_bbp_topic_id'] || reply.postParent;
    if (!topicId) continue;
    if (!repliesByTopic[topicId]) repliesByTopic[topicId] = [];
    repliesByTopic[topicId].push(reply);
  }
  console.log(`  Replies span ${Object.keys(repliesByTopic).length} unique topics.\n`);

  // ── 4. Delete existing forum threads ──
  const deleteResult = await ForumThread.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} existing forum threads.\n`);

  // ── 5. Build ForumThread documents ──
  console.log('Building forum thread documents...');
  let authorMatched = 0;
  let authorFallback = 0;
  let totalReplies = 0;
  let skippedNoContent = 0;

  const threads = [];

  for (const topic of topicItems) {
    const rawContent = topic.content || '';
    const cleanContent = htmlToText(rawContent);

    if (!topic.title && !cleanContent) {
      skippedNoContent++;
      continue;
    }

    // Resolve author
    let authorId = topic.creator ? loginToUserId[topic.creator] : null;
    if (authorId) { authorMatched++; } else { authorFallback++; authorId = admin._id; }

    // Date
    const wpDate = topic.postDate;
    const createdAt = wpDate && wpDate !== '0000-00-00 00:00:00'
      ? new Date(wpDate.replace(' ', 'T') + 'Z')
      : new Date();

    // Category from forum ID
    const forumId = topic.meta['_bbp_forum_id'] || topic.postParent;
    const category = FORUM_CATEGORY_MAP[forumId] || 'general';

    // Images from content + attachments
    const images = [
      ...extractImages(rawContent),
      ...(attachmentsByParent[topic.postId] || []),
    ];

    // Build replies array (sorted by menu_order)
    const topicReplies = (repliesByTopic[topic.postId] || [])
      .sort((a, b) => parseInt(a.menuOrder || '0') - parseInt(b.menuOrder || '0'));

    let lastReplyAt = createdAt;
    let lastReplyBy = null;

    const replies = [];
    for (const reply of topicReplies) {
      const replyRaw = reply.content || '';
      let replyContent = htmlToText(replyRaw);

      // Append image URLs from content + attachments
      const replyImages = [
        ...extractImages(replyRaw),
        ...(attachmentsByParent[reply.postId] || []),
      ];
      if (replyImages.length > 0) {
        replyContent += '\n\n' + replyImages.map(url => `[Image: ${url}]`).join('\n');
      }

      if (!replyContent) continue;

      let replyAuthorId = reply.creator ? loginToUserId[reply.creator] : null;
      if (!replyAuthorId) replyAuthorId = admin._id;

      const replyDate = reply.postDate && reply.postDate !== '0000-00-00 00:00:00'
        ? new Date(reply.postDate.replace(' ', 'T') + 'Z')
        : new Date();

      if (replyDate > lastReplyAt) {
        lastReplyAt = replyDate;
        lastReplyBy = replyAuthorId;
      }

      totalReplies++;
      replies.push({
        content: replyContent,
        author: replyAuthorId,
        likes: [],
        createdAt: replyDate,
        updatedAt: replyDate,
        isEdited: false,
      });
    }

    threads.push({
      title: (topic.title || 'Untitled').substring(0, 200),
      content: cleanContent || 'No content available.',
      author: authorId,
      category,
      tags: topic.tags.slice(0, 10),
      images,
      isPinned: topic.isSticky === '1',
      isLocked: false,
      replies,
      views: Math.floor(Math.random() * 100) + 5,
      likes: [],
      subscribers: [],
      lastReplyAt: replies.length > 0 ? lastReplyAt : undefined,
      lastReplyBy: replies.length > 0 ? lastReplyBy : undefined,
      status: 'active',
      createdAt,
      updatedAt: lastReplyAt,
    });
  }

  console.log(`  Built ${threads.length} threads with ${totalReplies} total replies.`);
  console.log(`  Skipped ${skippedNoContent} topics with no content.`);
  console.log(`  Authors: ${authorMatched} matched, ${authorFallback} fallback to admin.\n`);

  // ── 6. Insert in batches ──
  console.log('Inserting threads...');
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < threads.length; i += BATCH_SIZE) {
    const batch = threads.slice(i, i + BATCH_SIZE);
    await ForumThread.insertMany(batch);
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${threads.length}...`);
  }

  // ── Summary ──
  const catCounts = {};
  threads.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  console.log('\nCategory distribution:', catCounts);
  console.log('Threads with replies:', threads.filter(t => t.replies.length > 0).length);
  console.log('Threads with images:', threads.filter(t => t.images.length > 0).length);
  console.log('Total replies migrated:', totalReplies);
  console.log('Avg replies per thread:', (totalReplies / threads.length).toFixed(1));

  await mongoose.disconnect();
  console.log('\nDone! Forum migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
