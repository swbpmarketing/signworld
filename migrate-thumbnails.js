require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const { downloadAndUploadThumbnail } = require('./backend/utils/videoDuration');

async function migrateThumbnails() {
  try {
    console.log('🚀 Starting thumbnail migration...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Video = require('./backend/models/Video');

    // Find all videos with YouTube URLs that don't have S3 thumbnails
    const videos = await Video.find({
      youtubeUrl: { $exists: true, $ne: null },
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: null },
        { thumbnailUrl: '' }
      ]
    });

    console.log(`📹 Found ${videos.length} videos to migrate\n`);

    if (videos.length === 0) {
      console.log('✨ No videos need migration!');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`[${i + 1}/${videos.length}] Processing: "${video.title}"`);

      try {
        // Extract YouTube ID
        const match = video.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

        if (!match) {
          console.log(`   ⚠️  Could not extract YouTube ID from: ${video.youtubeUrl}`);
          failCount++;
          continue;
        }

        const youtubeId = match[1];
        console.log(`   📥 Downloading thumbnail for YouTube ID: ${youtubeId}`);

        // Download and upload thumbnail
        const s3Url = await downloadAndUploadThumbnail(youtubeId);

        if (s3Url) {
          // Update video with S3 thumbnail URL
          video.thumbnailUrl = s3Url;
          // Clear the old YouTube thumbnail URL
          video.thumbnail = undefined;
          await video.save();

          console.log(`   ✅ Success! Thumbnail saved to: ${s3Url}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to download thumbnail`);
          failCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📹 Total: ${videos.length}`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Migration complete! Database disconnected.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateThumbnails();
