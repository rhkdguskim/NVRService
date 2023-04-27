const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const path = require('path');

const arg1 = process.argv[2];

console.log("child process")
const scriptPath = path.resolve(__dirname, 'gizmo.mp4');

ffmpeg('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_30MB.mp4')
.setFfmpegPath(ffmpeg_static)
.addOption('-vcodec', 'copy')
.addOption('-f', 'mp4')
.addOption('-movflags', 'frag_keyframe+empty_moov+default_base_moof')
.outputFormat('mp4')
.on('start', (err) => {
    console.log("Streaming Started");
})
.on('error', (err) => {
    console.error('Error:', err.message);
})
.on('end', () => {
    console.log('FFmpeg instance closed');
}).output(process.stdout) // Add this line
.run();



