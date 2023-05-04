const EventEmitter = require('events');
const ffmpeg_static = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const { PassThrough } = require('stream');
var onvifCam = require('onvif').Cam;
const Datastore = require('nedb');
const fs = require('fs');
//const db = new Datastore({ filename: 'db/CameraProfileDB', autoload: true });
//const db = new Datastore({ filename: 'db/VodDB', autoload: true });

class Camera extends onvifCam {
    constructor(camname, ip, port, username, password , id) {
    super({hostname : ip, username, password, port,autoconnect:false, timeout:10000})
      this.ip = ip;
      this.port = port;
      this.username = username;
      this.password = password;
      this.cameraname = camname;
      this.id = id;
      
      this.fluentffmpeg = new Map();
      this.ffmpegStreams = new Map();
      this.rtspurl = new Map();
      this.profilelist = [];
      this.Emitter = new EventEmitter();
      this.livestreamMap = new Map();
    }

    start()
    {
        this.connect();
        this.interval = setInterval(() => {
            this.connect();
          }, 5000);
    }

    SetID(id)
    {
        this.id = id;
    }

    stop()
    {
        clearInterval(this.interval);
    }

    connect()
    {
        if(!this.connected)
        {
          super.connect(this.Callbackfunc);
        }
          
    }

    SetLiveProfile(profile)
    {
      this.liveprofile = profile;
    }

    SetProtocolType(protocol)
    {
      this.protocoltype = protocol;
    }

    StratLiveprofile()
    {
      this.getFFmpegStream(this.liveprofile);
    }

    Callbackfunc(err)
    {
        if (err) {
            this.connected = false;
            this.Emitter.emit('offline', (err));
            //console.log('Connection Failed for ' + this.ip + ' Port: ' + this.port + ' Username: ' + this.username + ' Password: ' + this.password);
            return;
        }
        this.connected = true;
        this.Emitter.emit('online');

        this.getCapabilities((err, capabilities) => {
          if (err) {
            console.error('Error getting media capabilities:', err);
            return;
          }
          console.log(capabilities);
        });
      
         //console.log("[Camera Connected] "+"IP: " + this.ip + ' Port: ' + this.port);
         this.getProfiles(function(err, profiles) {
            //console.log(profiles[0].$.token);
            if (err) {
              console.log('Error: ' + err.message);
            } else {
            for(let i=0; i<profiles.length; i++)
            {
              const profilename = profiles[i].$.token;
              //console.log(profilename);
              this.getStreamUri({
                protocol: 'RTSP',
                profileToken: profilename
              }, function(err, stream) {
                if (err) {
                  console.log('Error: ' + err.message);
                } else {
                  stream.uri = stream.uri.slice(7);
                  //console.log(`rtsp://${this.username}:${this.password}@`+ stream.uri);
                  this.rtspurl.set(profilename, `rtsp://${this.username}:${this.password}@`+ stream.uri);
                  //console.log("RtspUrl Map : ", this.rtspurl);
                }
              });
            }
            //console.log(profiles);
            //const keysToKeep = [$.token]; // 제외할 키 목록

            profiles.map((obj) => {
              //console.log(obj.$.token)
              this.profilelist.push({name : obj.$.token});
              }
              );
            //console.log(this.profilelist, this.ip);
            //this.profilelist = profiles;
            this.Emitter.emit('profile', (this.profilelist));
            }
          });

    }

    getFFmpegStream(profile) {
      if (this.ffmpegStreams.get(profile)) {
        console.log("alreay exist");
        return ;
      }

      const args = [
        '-i',
        `${this.rtspurl.get(profile)}`, //`${camera.rtspurl.get(camera.liveprofile)}`
        '-vcodec',
        'copy',
        '-f',
        'mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags',
        'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1',
      ];

      // const args = [
      //   '-i',
      //   `${this.rtspurl.get(profile)}`,
      //   '-c:v', 'mpeg1video', // 비디오 코덱을 MPEG-1로 설정
      //   '-f', 'mpegts',
      //    'pipe:1',
      // ];
      
      this.fluentffmpeg.set(profile, spawn(ffmpeg_static, args));
      const childProcess = this.fluentffmpeg.get(profile);

      const passThrough = new PassThrough();
      childProcess.stdout.on('data', (data) => {
        passThrough.write(data);
      });

      childProcess.stdout.on('start', () => {
        console.log("Stream Stared start");
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
    
    StartMP4Stream()
    {
      const args = [
        '-i',
        //'-re',
        `${this.rtspurl.get(this.liveprofile)}`, //`${camera.rtspurl.get(camera.liveprofile)}` // this.rtspurl.get(profile)
        '-vcodec',
        'copy',
        '-f',
        'mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags', 'frag_keyframe+empty_moov',
        'pipe:1',
      ];
      
      this.mp4Proc = spawn(ffmpeg_static, args);
    }

    StopMP4Stream()
    {
      this.mp4Proc.kill();
    }

    AddLiveStreamMap(uuid)
    {
      this.livestreamMap.set(uuid, new PassThrough());
    }

    DelLiveStreamMap(uuid)
    {
      this.livestreamMap.delete(uuid);
    }


    StartHLSStream(profile) {
      const dir = `./hls/${this.id}`;

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const args = [
        '-i',
        `${this.rtspurl.get(profile)}`, // ${this.rtspurl.get(profile)}
        '-c:v', 'libx264', // 비디오 코덱을 MPEG-1로 설정
        '-f', 'hls', // hls 스트리밍
        '-hls_time', '1', // ts 파일 크기
        `-hls_list_size`,'10', // ts파일 개수
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
         '-hls_init_time', '1',
        `-hls_segment_filename`, `hls/${this.id}/ts_%03d.ts`, // ts 파일 포맷 설정
        `-hls_flags` , `delete_segments+append_list`, // ts파일 삭제
         `hls/${this.id}/play.m3u8`, // output파일 지정
      ];
      
      this.hlsProc = spawn(ffmpeg_static, args);

      this.hlsProc.stderr.on('data', (data) => {
        //console.error(`FFmpeg stderr: ${data}`);
      });
    }

    StopHLSStream()
    {
      this.hlsProc.kill();
    }



  };

  module.exports = Camera;