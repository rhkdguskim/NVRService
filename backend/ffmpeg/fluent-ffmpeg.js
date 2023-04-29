const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const path = require('path');

const arg1 = process.argv[2];

//console.log("child process")
//const scriptPath = path.resolve(__dirname, 'gizmo.mp4');

ffmpeg(arg1)
.setFfmpegPath(ffmpeg_static)
.videoCodec('libx264') // 비디오 코덱을 H.264로 설정
//.videoCodec('mpeg1video') // 비디오 코덱을 MPEG-1로 설정
.addOption('-f', 'mpegts')
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



