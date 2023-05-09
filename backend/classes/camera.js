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
require('dotenv').config();
const debug = process.env.DEBUG === 'true';

class Camera extends onvifCam {
    constructor(camname, ip, port, username, password , id) {
    super({hostname : ip, username, password, port,autoconnect:false, timeout:10000})
      this.ip = ip;
      this.port = port;
      this.username = username;
      this.password = password;
      this.cameraname = camname;
      this.id = id;
      
      this.StreamProcess = new Map();
      this.StreamList = new Map();

      this.rtspurl = new Map();
      this.profilelist = [];
      this.Emitter = new EventEmitter();
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
          //console.log(capabilities);
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
                  if(debug)
                    console.log("RtspUrl Map : ", this.rtspurl);
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
            //console.log(this.liveprofile);
            }
          });
    }

    StartMP4Stream(uuid) { // MP4 Stream 생성

      if(this.StreamProcess.has(this.liveprofile))
      {
        this.StreamProcess.get(this.liveprofile).kill();
        this.StreamProcess.delete(this.liveprofile);
      }

      if(this.StreamList.has(uuid))
        return this.StreamList.get(uuid);

      const Stream = new PassThrough({ highWaterMark: 128 * 1024 });
      this.StreamList.set(uuid, Stream);
      
      //console.log(this.rtspurl.get(this.liveprofile))
      const args =  debug ? [
        '-i',
        `BigBuckBunny.mp4`,
        '-vcodec',
        'copy',
        '-f',
        'mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags',
        'frag_keyframe+separate_moov',
        'pipe:1',
      ] : [
        '-i',
        `${this.rtspurl.get(this.liveprofile)}`,
        '-rtsp_transport','udp',
        '-rtsp_flags', 'listen',
        '-vcodec',
        'copy',
        '-f' ,'mp4',
        //'-f', 'segment',
        //'-segment_time', '2',
        //'-segment_format','mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags',
        'frag_keyframe+empty_moov+default_base_moof+separate_moof+omit_tfhd_offset',
        'pipe:1',
      ]

      if(this.StreamProcess.has(this.liveprofile))
        return Stream;

      const ChildProcess = spawn(ffmpeg_static, args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.StreamProcess.set(this.liveprofile, ChildProcess);

      ChildProcess.stderr.on('data', (data) => {
          //console.log(data.toString());
      });

      ChildProcess.stdout.on('data', (data) => {
        const streamProcess = this.StreamProcess.get(this.liveprofile);
        if(streamProcess === ChildProcess) {
          this.StreamList.forEach((value, key) => {
            //console.log(key + " Streaming");
            value.write(data);
          });
        }
    });

      ChildProcess.stdout.on('start', () => {
          console.log("Stream Stared start");
      });

      ChildProcess.stdout.on('end', () => {
          console.log("Stream End");
      });

      return Stream;
    }

    StartHLSStream(profile) { // HLS Stream 생성
      if(this.StreamProcess.has(profile))
      {
        console.log("already Exsist");
        return this.StreamProcess.get(profile);
      }  

      const dir = `./hls/${this.id}`;

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const args = debug ?  [
        '-rtsp_transport','udp',
        '-rtsp_flags', 'listen',
        '-i',
        `BigBuckBunny.mp4`, // ${this.rtspurl.get(profile)}
        '-vcodec',
        'copy',
        '-f', 'hls', // hls 스트리밍
        '-hls_time', '2', // ts 파일 크기
        `-hls_list_size`,'10', // ts파일 개수
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
         '-hls_init_time', '1',
        `-hls_segment_filename`, `hls/${this.id}/ts_%03d.ts`, // ts 파일 포맷 설정
        `-hls_flags` , `delete_segments+append_list`, // ts파일 삭제
         `hls/${this.id}/play.m3u8`, // output파일 지정
      ] :
      [
        '-rtsp_transport','udp',
        '-rtsp_flags', 'listen',
        '-i',
        `${this.rtspurl.get(profile)}`, // ${this.rtspurl.get(profile)}
        '-vcodec',
        'copy',
        '-f', 'hls', // hls 스트리밍
        '-hls_time', '2', // ts 파일 크기
        `-hls_list_size`,'10', // ts파일 개수
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
         '-hls_init_time', '1',
        `-hls_segment_filename`, `hls/${this.id}/ts_%03d.ts`, // ts 파일 포맷 설정
        `-hls_flags` , `delete_segments+append_list`, // ts파일 삭제
         `hls/${this.id}/play.m3u8`, // output파일 지정
      ]
      
      const ChildProcess = spawn(ffmpeg_static, args, {
        windowsHide: true
      });

      this.StreamProcess.set(profile, ChildProcess);

      ChildProcess.stderr.on('data', (data) => {
        if(debug)
          console.log(data.toString());
      });

      ChildProcess.stdout.on('start', () => {
        if(debug)
          console.log("Stream Stared start");
      });

      ChildProcess.stdout.on('end', () => {
        console.log("end");
        //this.KillStreamProcess(profile);
      });

      return ChildProcess;
    }

    StartMjpegStream(profile)
    {
      const args = [
        '-i',
        `BigBuckBunny.mp4`, //`${camera.rtspurl.get(camera.liveprofile)}` // this.rtspurl.get(profile)
         '-vcodec',
         'copy',
         '-r', '30',
        '-f',
        'mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags', 'frag_keyframe+empty_moov',
        'pipe:1',
      ];
      
      const ChildProcess = spawn(ffmpeg_static, args);

      this.StreamProcess.set(profile, ChildProcess);

      ChildProcess.stdout.on('start', () => {
        console.log("Stream Stared start");
      });

      ChildProcess.stdout.on('end', () => {
        console.log("end");
      });
    }

    KillStreamProcess(profile) {
      this.StreamProcess.get(profile).kill();
      this.StreamProcess.delete(profile);
    }

  };

  module.exports = Camera;