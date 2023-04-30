const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');

const arg1 = process.argv[2];
const arg2 = process.argv[3];

ffmpeg(arg1)
.setFfmpegPath(ffmpeg_static)
.videoCodec('copy')
.format('mp4')
.outputOptions(['-tune', 'zerolatency'])
.outputOptions('-movflags', 'frag_keyframe+empty_moov+default_base_moof')
.on('start', () => {
  console.log('Streaming Started');
})
.on('error', (err) => {
  console.error('Error:', err.message);
})
.on('end', () => {
  console.log('FFmpeg instance closed');
}).output(process.stdout) // Add this line
.run();






