const EventEmitter = require('events');
const ffmpeg_static = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const { PassThrough } = require('stream');
var onvifCam = require('onvif').Cam;
const Datastore = require('nedb');

//const db = new Datastore({ filename: 'db/CameraProfileDB', autoload: true });
//const db = new Datastore({ filename: 'db/VodDB', autoload: true });

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

      this.Emitter = new EventEmitter();
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
    }

    connect()
    {
        if(!this.connected)
            super.connect(this.Callbackfunc);
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
         console.log("[Camera Connected] "+"IP: " + this.ip + ' Port: ' + this.port);
         this.getProfiles(function(err, profiles) {
            if (err) {
              console.log('Error: ' + err.message);
            } else {
            for(let i=0; i<profiles.length; i++)
            {
              this.getStreamUri({
                protocol: 'RTSP',
                profileToken: profiles[i].name
              }, function(err, stream) {
                if (err) {
                  console.log('Error: ' + err.message);
                } else {
                  stream.uri = stream.uri.slice(7);
                  this.rtspurl.set(profiles[i].name, `rtsp://${this.username}:${this.password}@`+ stream.uri);
                  console.log("RtspUrl Map : ", this.rtspurl);
                }
              });
            }
            this.profilelist = profiles;
            this.Emitter.emit('profile', (profiles));
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
        'BigBuckBunny.mp4',
        '-vcodec',
        'copy',
        '-f',
        'mp4',
        '-tune',
        'zerolatency',
        '-movflags',
        'frag_keyframe+empty_moov+default_base_moof',
         'pipe:1',
      ];
      

      console.log(this.rtspurl.get(profile));
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

    getFFmpegStreamMp4() {
      const nodePath = process.execPath;
      const scriptPath = path.resolve(__dirname, '../ffmpeg/fluent-ffmpeg_mp4.js');
      return spawn(nodePath, [scriptPath, "BigBuckBunny.mp4"]);
    }
    

    KillFFmpegStream(profile) {
      this.fluentffmpeg[profile].kill();
      this.fluentffmpeg.delete(profile);
      this.ffmpegStreams.delete(profile);
    }

  };

  module.exports = Camera;