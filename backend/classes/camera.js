const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const { spawn } = require('child_process');
const { PassThrough } = require('stream');
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
      this.fluentffmpeg = new Map();
      this.ffmpegStreams = new Map();
      this.rtspurl = new Map();
      //this.getFFmpegStream("profile");
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
         this.getProfiles(function(err, profiles) {
            if (err) {
              console.log('Error: ' + err.message);
            } else {
              // 프로파일 목록 출력
              //console.log('Profiles:', profiles);
              // 첫 번째 프로파일의 스트림 URL 가져오기
            for(let i=0; i<profiles.length; i++)
            {
              //console.log(profiles[i].name)
              this.getStreamUri({
                protocol: 'RTSP',
                profileToken: profiles[i].name
              }, function(err, stream) {
                if (err) {
                  console.log('Error: ' + err.message);
                } else {
                  console.log('Stream URL:', stream.uri);
                  stream.uri = stream.uri.slice(7);
                  this.rtspurl[profiles[i].name] = `rtsp://${this.username}:${this.password}@`+ stream.uri;
                  //console.log(this.rtspurl)
                }
              });
            }
            }
          });

        //  super.getStreamUri({protocol: 'RTSP'}, function(err, stream) {
        //    stream.uri = stream.uri.slice(7);
        //    this.rtspurl = `rtsp://${this.username}:${this.password}@`+ stream.uri;
        //  });
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
        ffmpeg(this.rtspurl['Profile1'])
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
        ffmpeg(this.rtspurl['Profile2'])
        .setFfmpegPath(ffmpeg_static)
        .videoCodec('copy')
        // .outputOptions('-c:v', 'libx264')
        // .outputOptions('-c:a', 'copy')

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

    StartStream()
    {

    }

    getFFmpegStream(profile) {
      //console.log(profile);
      //console.log(this.ffmpegStreams[profile]);
      if (this.ffmpegStreams[profile]) {
        return ;
      }
      //console.log("test");
      //console.log(this.rtspurl[profile]);
      const nodePath = process.execPath;
      //console.log(nodePath);
      const scriptPath = path.resolve(__dirname, '../ffmpeg/fluent-ffmpeg.js');
      //console.log(scriptPath);
      this.fluentffmpeg.set(profile, spawn(nodePath, [scriptPath, this.rtspurl[profile]]));
      // this.fluentffmpeg[profile].stdout.on('data', (data) => {
      //   console.log(`Output: ${data}`);
      // });
      
      // this.fluentffmpeg[profile].stderr.on('data', (data) => {
      //   console.error(`Error: ${data}`);
      // });
      
      // this.fluentffmpeg[profile].on('close', (code) => {
      //   console.log(`Child process exited with code ${code}`);
      // });
      //console.log(this.fluentffmpeg.get(profile));
      const childProcess = this.fluentffmpeg.get(profile);

      const passThrough = new PassThrough();
      childProcess.stdout.on('data', (data) => {
        //console.log(data);
        passThrough.write(data);
      });

      childProcess.stdout.on('end', () => {
        console.log("end");
        passThrough.end();
      });

      this.ffmpegStreams.set(profile, passThrough);
    }

    KillFFmpegStream(profile) {
      this.fluentffmpeg[profile].kill();
      this.fluentffmpeg.delete(profile);
      this.ffmpegStreams.delete(profile);
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