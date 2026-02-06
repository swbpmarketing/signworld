require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

async function fixVideo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Video = require('./backend/models/Video');

    // Get the latest video
    const video = await Video.findOne({ _id: '696a20b3853ea3ae6a2986ca' });

    if (video) {
      console.log('\nBefore update:');
      console.log('Duration:', video.duration);
      console.log('Thumbnail:', video.thumbnail);

      // Update thumbnail to use hqdefault
      video.thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

      // If duration is empty, set it to null so auto-fetch can work next time
      // For now, we'll leave it empty since the user needs to re-enter it

      await video.save();

      console.log('\nAfter update:');
      console.log('Duration:', video.duration);
      console.log('Thumbnail:', video.thumbnail);
      console.log('\n✅ Video updated successfully');
    } else {
      console.log('Video not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixVideo();
