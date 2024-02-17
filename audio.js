const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Tell fluent-ffmpeg where it can find FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

async function convertAudio(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions('-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '44100')
      .save(outputFilePath)
      .on('end', () => {
        console.log('FFmpeg has finished.');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      });
  });
}

// Example usage
const inputFilePath = 'audio.mp3';
const outputFilePath = 'output.raw';
convertAudio(inputFilePath, outputFilePath)
  .then(() => {
    console.log('Conversion successful');
  })
  .catch((err) => {
    console.error('Conversion failed:', err);
  });
