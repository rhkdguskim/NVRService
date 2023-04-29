const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const arg1 = process.argv[2];

console.log("child process")


const outputPath = path.join(__dirname, 'output');

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    }

const outputFileName = 'output.m3u8';

ffmpeg('BigBuckBunny.mp4')
.setFfmpegPath(ffmpeg_static)
  .outputOptions([
    '-f hls',
    //"-f mpegts",
    '-hls_time 1', // 각 세그먼트 파일의 길이를 5초로 설정
    '-hls_list_size 1',
    '-hls_flags delete_segments+append_list', // 세그먼트 파일(.ts) 생성 후, 이전 세그먼트 파일 삭제
    `-hls_segment_filename output/%03d.ts`,
    '-start_number 0', // 시작 번호를 0으로 설정
    //'-hls_start_number 0', // 시작 번호를 0으로 설정
    //'-hls_start 2' // 첫 번째 세그먼트 파일의 시작 시간을 2초로 설정
  ])
  .addOption('-threads', 4) // CPU 코어 수만큼 스레드 사용
  .outputFormat('hls') // 이 부분 수정
  .output(path.join(outputPath, outputFileName))
  .on('end', () => console.log('HLS streaming file created successfully'))
  .on('error', function(err, stdout, stderr) {
    if (err) {
        console.log(err.message);
        console.log("stdout:\n" + stdout);
        console.log("stderr:\n" + stderr);
    }
})
  .run();


