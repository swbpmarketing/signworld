require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

async function checkLatestVideo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Video = require('./backend/models/Video');

    // Get the latest video
    const latestVideo = await Video.findOne().sort({ createdAt: -1 });

    if (latestVideo) {
      console.log('\nLatest Video:');
      console.log('Title:', latestVideo.title);
      console.log('YouTube URL:', latestVideo.youtubeUrl);
      console.log('YouTube ID:', latestVideo.youtubeId);
      console.log('Duration:', latestVideo.duration);
      console.log('Thumbnail:', latestVideo.thumbnail);
      console.log('Thumbnail URL:', latestVideo.thumbnailUrl);
      console.log('Category:', latestVideo.category);
      console.log('Featured:', latestVideo.isFeatured);
      console.log('\nFull video object:');
      console.log(JSON.stringify(latestVideo, null, 2));
    } else {
      console.log('No videos found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestVideo();
