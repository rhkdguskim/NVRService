const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
var onvifCam = require('onvif').Cam;
const Datastore = require('nedb');

const db = new Datastore({ filename: 'db/VodDB', autoload: true });

class Camera extends onvifCam {
    constructor(camname, ip, port, username, password) {
    super({hostname : ip, username, password, port,autoconnect:false, timeout:10000})
      this.ip = ip;
      this.port = port;
      this.username = username;
      this.password = password;
      this.cameraname = camname;
    }

    start()
    {
        this.connect();
        this.interval = setInterval(() => {
            this.connect();
          }, 5000);
    }
    stop()
    {
        clearInterval(this.interval);
        this.StopStream();
        this.StopBackup();
    }

    connect()
    {
        if(!this.connected)
            super.connect(this.Callbackfunc);
    }

    Callbackfunc(err)
    {
        if (err) {
            this.connected = false;
            //console.log('Connection Failed for ' + this.ip + ' Port: ' + this.port + ' Username: ' + this.username + ' Password: ' + this.password);
            return;
        }
        this.connected = true;
         console.log('Camera is Connected');
         super.getStreamUri({protocol: 'RTSP'}, function(err, stream) {
           stream.uri = stream.uri.slice(7);
           this.rtspurl = `rtsp://${this.username}:${this.password}@`+ stream.uri;
           this.StartStream();
         });
    }

    StartBackup()
    {
        this.isbackup = true;
        let currentTime = Date.now();
        let outputFile = `vod/${this.cameraname}/vod_${currentTime}.mp4`;
        const segmentDuration = 10; // 분할할 시간 간격 (초 단위)

        const outputDirectory = path.dirname(outputFile);

        if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
        }

        this.ffmpegbackupInstance = 
        ffmpeg(this.rtspurl)
        .setFfmpegPath(ffmpeg_static)
        .outputOptions('-f segment')
        .outputOptions(`-segment_time ${segmentDuration}`)
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-c:a', 'copy')
        .format('mp4')
        .outputOptions('-movflags', 'frag_keyframe+empty_moov+default_base_moof')
        .output(outputFile)
        .on('start', (err) => {
            console.log("Vod Backup Started");
        })
        .on('error', (err) => {
            console.error('Error:', err.message);
        })
        .on('end', () => {
            console.log(`Segment ${currentSegment} is complete`);
            currentTime = Date.now();
            outputFile = `vod/${this.cameraname}_vod_${currentTime}.mp4`;
            this.ffmpegbackupInstance.run();

        }).run();
    }

    StopBackup()
    {
        this.isbackup = false;
        this.ffmpegbackupInstance = null;
    }

    StartStream()
    {
        console.log("StartStream rtspurl : " + this.rtspurl);
        this.ffmpegInstance = 
        ffmpeg(this.rtspurl)
        .setFfmpegPath(ffmpeg_static)
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-c:a', 'copy')

        .size('640x480')
        .format('mp4')
        .outputOptions('-movflags', 'frag_keyframe+empty_moov+default_base_moof')
        .on('start', (err) => {
            console.log("Streaming Started");
        })
        .on('error', (err) => {
            console.error('Error:', err.message);
            this.StartStream();
        })
        .on('end', () => {
            console.log('FFmpeg instance closed');
        })
    }

    StopStream() {
        this.ffmpegInstance = null;
    }

    PipeStream(stream) {
        console.log('PipeStream');
        this.ffmpegInstance.pipe(stream);
    }

  };

  module.exports = Camera;