const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';
const SOURCE_FOLDER = 'C:\\Users\\Kristine\\Downloads\\Signworld Training Files';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // You'll need to set this

if (!AUTH_TOKEN) {
  console.error('ERROR: AUTH_TOKEN environment variable not set');
  console.log('To get your token:');
  console.log('1. Login to the dashboard');
  console.log('2. Open DevTools (F12) → Application → LocalStorage → token');
  console.log('3. Run: set AUTH_TOKEN=<your-token> && node bulk-upload.js');
  process.exit(1);
}

let stats = {
  foldersCreated: 0,
  filesUploaded: 0,
  filesFailed: 0,
  filesSkipped: 0,
  startTime: Date.now()
};

const folderCache = {}; // Cache folder IDs by path
const uploadLog = {}; // Track uploaded files to avoid duplicates

// Load upload history from file
const UPLOAD_LOG_FILE = path.join(__dirname, 'upload-log.json');
function loadUploadLog() {
  try {
    if (fs.existsSync(UPLOAD_LOG_FILE)) {
      const data = fs.readFileSync(UPLOAD_LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.log('No previous upload log found, starting fresh');
  }
  return {};
}

// Save upload history
function saveUploadLog() {
  try {
    fs.writeFileSync(UPLOAD_LOG_FILE, JSON.stringify(uploadLog, null, 2));
  } catch (err) {
    console.error('Error saving upload log:', err.message);
  }
}

// Map folder names to predefined categories
const FOLDER_TO_CATEGORY = {
  'Human Resource Files': 'hr',
  'Marketing': 'marketing',
  'Sales & Marketing Files': 'marketing',
  'Web Marketing': 'marketing',
  'Grow Your Business Webinar Presentation Materials': 'training',
  'Training Job Files': 'training',
  '2022 Signworld Convention Presentations': 'training',
  'Forms': 'forms',
  'Operations Files': 'operations',
  'Application, Design & Installation': 'training',
  'Design Files': 'artwork',
  'Art & Science of Pricing': 'training',
  'Accounting and Financials': 'operations',
  'ISA Resources': 'training',
  'Mastermind': 'training',
  'Pre-Opening': 'training',
  'Process Documentation': 'training',
  'Technical': 'training',
  'Technology Spotlight': 'training',
  'Work Tables & Substrate Rack': 'operations'
};

/**
 * Get all top-level directories (categories)
 */
function getTopLevelFolders() {
  try {
    const entries = fs.readdirSync(SOURCE_FOLDER, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => ({
        name: e.name,
        path: path.join(SOURCE_FOLDER, e.name),
        category: FOLDER_TO_CATEGORY[e.name] || 'other' // Map to category
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error reading top-level folders:', err.message);
    return [];
  }
}

/**
 * Get all files recursively from a folder
 */
function getAllFiles(dir, baseCategory) {
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively get files from subdirectories
        const subFiles = getAllFiles(fullPath, baseCategory);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Get relative path for folder structure
        const relativePath = path.relative(path.join(SOURCE_FOLDER, baseCategory), dir);
        files.push({
          name: entry.name,
          path: fullPath,
          relativePath: relativePath || '.',
          category: baseCategory
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }

  return files;
}

/**
 * Create a folder via API
 */
async function createFolder(folderName, category, parentFolderId = null) {
  const cacheKey = parentFolderId ? `${parentFolderId}/${folderName}` : `${category}/${folderName}`;

  if (folderCache[cacheKey]) {
    return folderCache[cacheKey];
  }

  try {
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        category: category,
        parentFolderId: parentFolderId || undefined
      })
    });

    const data = await response.json();

    if (data.success) {
      folderCache[cacheKey] = data.data._id;
      console.log(`  ✅ Created folder: ${folderName} (ID: ${data.data._id})`);
      stats.foldersCreated++;
      return data.data._id;
    } else if (response.status === 400 && data.error?.includes('already exists')) {
      // Folder exists, need to get its ID
      const queryParams = new URLSearchParams({ category });
      if (parentFolderId) {
        queryParams.append('parentId', parentFolderId);
      }

      const foldersResponse = await fetch(`${API_URL}/folders?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const foldersData = await foldersResponse.json();

      if (foldersData.success) {
        const folder = foldersData.data.find(f => f.name === folderName);
        if (folder) {
          folderCache[cacheKey] = folder._id;
          console.log(`  ✓  Folder already exists: ${folderName}`);
          return folder._id;
        }
      }

      console.error(`❌ Failed to find existing folder ${folderName} (checked with parentId: ${parentFolderId || 'null'})`);
      return null;
    } else {
      console.error(`❌ Failed to create folder ${folderName}: status=${response.status}, error=${data.error || JSON.stringify(data)}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Error creating folder ${folderName}:`, err.message);
    return null;
  }
}

/**
 * Create nested folder structure
 */
async function createFolderStructure(folderPath, folderName, categoryId, parentFolderId = null) {
  // Get relative path components
  const relativePath = path.relative(path.join(SOURCE_FOLDER, folderName), folderPath);

  if (relativePath === '.') {
    return null; // Root of category
  }

  const parts = relativePath.split(path.sep);
  let currentParentId = parentFolderId;

  for (const part of parts) {
    if (part === '.') continue;

    currentParentId = await createFolder(part, categoryId, currentParentId);
    if (!currentParentId) return null;
  }

  return currentParentId;
}

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a file via API with retry logic
 */
async function uploadFile(filePath, fileName, category, folderId = null, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      // Add delay between uploads to avoid rate limiting
      if (attempt === 1) {
        await sleep(100); // Small delay before first attempt
      } else {
        await sleep(500 * attempt); // Exponential backoff for retries
      }

      const fileStream = fs.createReadStream(filePath);
      const form = new FormData();

      form.append('file', fileStream);
      form.append('title', fileName);
      form.append('description', `Bulk upload: ${fileName}`);
      form.append('category', category);
      form.append('tags', 'training,bulk-import');

      if (folderId) {
        form.append('folderId', folderId);
      }

      const response = await fetch(`${API_URL}/library`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          ...form.getHeaders()
        },
        body: form,
        timeout: 60000 // 60 second timeout per request
      });

      const data = await response.json();

      if (data.success) {
        stats.filesUploaded++;
        return true;
      } else {
        if (attempt <= retries) {
          console.error(`  ⚠️  Upload attempt ${attempt} failed for ${fileName}, retrying...`);
          continue;
        } else {
          console.error(`  ❌ Upload failed for ${fileName} after ${retries + 1} attempts:`, data.error);
          stats.filesFailed++;
          return false;
        }
      }
    } catch (err) {
      if (attempt <= retries) {
        console.error(`  ⚠️  Upload attempt ${attempt} error for ${fileName}: ${err.message}, retrying...`);
        continue;
      } else {
        console.error(`  ❌ Error uploading ${fileName} after ${retries + 1} attempts:`, err.message);
        stats.filesFailed++;
        return false;
      }
    }
  }
}

/**
 * Main bulk upload function
 */
async function bulkUpload() {
  console.log('\n🚀 Starting bulk upload process...');
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`);
  console.log(`🔗 API URL: ${API_URL}\n`);

  // Load previously uploaded files to avoid duplicates
  Object.assign(uploadLog, loadUploadLog());
  if (Object.keys(uploadLog).length > 0) {
    console.log(`📋 Loaded ${Object.keys(uploadLog).length} previously uploaded files, will skip these\n`);
  }

  const categories = getTopLevelFolders();
  console.log(`Found ${categories.length} categories to process\n`);

  for (const folder of categories) {
    console.log(`\n📂 Processing folder: ${folder.name}`);
    console.log(`   Category: ${folder.category}`);

    // Get all files in this folder
    const files = getAllFiles(folder.path, folder.name);
    console.log(`  📊 Found ${files.length} files\n`);

    if (files.length === 0) {
      console.log(`  ⏭️  No files found, skipping\n`);
      continue;
    }

    // Group files by subfolder
    const filesByFolder = {};
    for (const file of files) {
      if (!filesByFolder[file.relativePath]) {
        filesByFolder[file.relativePath] = [];
      }
      filesByFolder[file.relativePath].push(file);
    }

    // Process each subfolder
    for (const [folderPath, folderFiles] of Object.entries(filesByFolder)) {
      let folderId = null;

      // Create folder structure if not root
      if (folderPath !== '.') {
        console.log(`  📁 Creating folder structure: ${folderPath}`);
        folderId = await createFolderStructure(path.join(folder.path, folderPath), folder.name, folder.category);
      }

      // Upload files to this folder
      console.log(`  📤 Uploading ${folderFiles.length} file(s)...`);
      for (const file of folderFiles) {
        // Create unique key for this file
        const fileKey = `${folder.category}/${file.relativePath}/${file.name}`;

        // Check if file was already uploaded
        if (uploadLog[fileKey]) {
          console.log(`  ⏭️  Skipping already uploaded: ${file.name}`);
          stats.filesSkipped++;
          process.stdout.write('s');
          continue;
        }

        // Upload the file
        const success = await uploadFile(file.path, file.name, folder.category, folderId);

        // Track successful uploads
        if (success) {
          uploadLog[fileKey] = {
            timestamp: new Date().toISOString(),
            folderId: folderId,
            fileSize: fs.statSync(file.path).size
          };
          saveUploadLog();
        }

        process.stdout.write('.');
      }
      console.log(' Done!\n');
    }
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Folders created: ${stats.foldersCreated}`);
  console.log(`✅ Files uploaded: ${stats.filesUploaded}`);
  console.log(`⏭️  Files skipped (already uploaded): ${stats.filesSkipped}`);
  console.log(`❌ Files failed: ${stats.filesFailed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(60) + '\n');

  // Save final upload log
  saveUploadLog();
}

// Run the script
bulkUpload().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
