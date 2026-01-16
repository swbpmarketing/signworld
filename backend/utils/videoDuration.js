const axios = require('axios');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Convert ISO 8601 duration to readable format (e.g., PT1H2M10S -> 1:02:10)
 */
function parseISO8601Duration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}

/**
 * Get YouTube video duration using YouTube Data API
 */
async function getYouTubeDuration(youtubeId) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY not configured, cannot fetch duration');
      return null;
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails',
        id: youtubeId,
        key: apiKey
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const duration = response.data.items[0].contentDetails.duration;
      return parseISO8601Duration(duration);
    }

    return null;
  } catch (error) {
    console.error('Error fetching YouTube duration:', error.message);
    return null;
  }
}

/**
 * Get video file duration using ffprobe (from ffmpeg)
 */
async function getVideoDuration(videoPath) {
  try {
    // Use ffprobe to get video duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );

    const durationSeconds = parseFloat(stdout.trim());

    if (isNaN(durationSeconds)) {
      return null;
    }

    // Convert seconds to readable format
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.floor(durationSeconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error extracting video duration:', error.message);
    return null;
  }
}

module.exports = {
  getYouTubeDuration,
  getVideoDuration,
  parseISO8601Duration
};
