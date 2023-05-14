const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")
const EventEmitter = require('events');
const { spawn } = require('child_process');
const ffmpeg_static = require('ffmpeg-static');
const { PassThrough } = require('stream');

class VicStream {
  constructor(userid, password) {
      this.Emitter = new EventEmitter();
      this.userid = userid;
      this.password = password;
      this.ChildProcess = new Map();
      this.logintry = 0;
      this.connected = false;
      this.oldTime = 0;
      this.streamMap = new Map();
      this.liveStreamMap = new Map();
      //console.log(this.userid, this.password)
    }

    timestamp = (uuid, sec) => {
      if(this.oldTime !== sec)
      {
        this.oldTime = sec;
        this.Emitter.emit(`timestamp/${uuid}`, {time:sec});
      }
    }

    startserver = () => {
      this.ws = new WebSocket('ws://127.0.0.1:9080/MilinkUserstream');
      // 연결이 열릴 때
      this.ws.onopen = () => {
        console.log('VicsStream WebSocket Started');
        this.connected = true;
        // 텍스트 데이터 전송

        this.ws.send(this.login(this.userid, this.password, "nonce"));
      };

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        // Additional error handling logic can be added here
      });

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        
        if(this.logined)
        {
          const message = event.data;
          const frameHeader = {
            streamType: Number(message.readInt32BE(0)),
            frameType: Number(message.readInt32BE(4)),
            seq: Number(message.readUInt32BE(8)),
            secs: Number(message.readUInt32BE(12)),
            msecs: Number(message.readUInt32BE(16)),
            dataLen: message.readInt32BE(20),
            UUID: message.slice(24, 60).toString(),
          };
          const data = message.slice(61);

          this.timestamp(frameHeader.UUID, frameHeader.secs);
          if(this.streamMap.has(frameHeader.UUID)) {
            if(this.streamMap.get(frameHeader.UUID) === "vod") {
              this.ChildProcess.get(uuid).stdin.write(data);
            }
          }

          return;
        }
        const cmd = JSON.parse(event.data);
        //console.log(cmd);
        //console.log(cmd);
        switch (cmd.type)
        {
          case 'LINK_CMD_LOGIN_RESP':
          {
            return this.processloginresp(cmd, this.userid, this.password);
            break;
          }
      
          default:
               break;
        };
        const json = JSON.parse(event.data);
        //console.log(json);
        
      };

      // 연결이 닫혔을 때
      this.ws.onclose = () => {
        this.connected = true;
        console.log('VicsStream WebSocket Stopped');
      };
    }

    startMJPEG(UUID) {
      if(!this.ChildProcess.has(UUID))
      {
        const childprocess = spawn(ffmpeg_static, [
          '-i', 'pipe:0',
          '-f',
          'mpegts',
          '-codec:v',
          'mpeg1video',
          '-r',
          '30',
          '-b:v', '1000k',
            '-preset', 'ultrafast',
            `-tune`, `zerolatency`,
          'pipe:1',
        ]);

        this.ChildProcess.set(UUID, childprocess);
        
        childprocess.stderr.on('data', (data) => {
          console.log(data.toString());
        });

        childprocess.stdout.on('data', (data) => {
          this.Emitter.emit(`play/${UUID}`, {data:data});
        });
      }
    }

    startMP4(UUID) {
      if(!this.ChildProcess.has(UUID))
      {
        const childprocess = spawn(ffmpeg_static, [
          '-i', 'pipe:0',
          '-vcodec',
          'copy',
          '-f' ,'mp4',
          `-preset`, `ultrafast`,
          `-tune`, `zerolatency`,
          '-movflags',
          'frag_keyframe+empty_moov+default_base_moof+separate_moof+omit_tfhd_offset',
          'pipe:1',
        ]);

        this.ChildProcess.set(UUID, childprocess);
        
        childprocess.stderr.on('data', (data) => {
          console.log(data.toString());
        });

        childprocess.stdout.on('data', (data) => {
          if(this.streamMap.has(UUID)) {
            if(this.streamMap.get(UUID) === 'vod') {
              this.Emitter.emit(UUID, {start:true, data:data});
            }
            else {
              this.liveStreamMap.forEach((value, key) => {
                value.write(data);
              })
            }
          }
        });
      }
    }

    sendmessage = (str) => {
      this.ws.send(str);
    }

    checkStream(uuid)
    {
      if(this.streamMap.has(uuid))
      {
        if(this.streamMap.get(uuid) == 'live')
        {
          this.stoplive();
        }
        else
        {
          this.stopvod();
        }
        this.streamMap.delete(uuid);
      }
    }

    login = (strUser, strPasswd, strNonce) => {
      const type = "LINK_CMD_LOGIN_REQ";
      const pass = strNonce + strPasswd;
    
      const md5Output = crypto.createHash('md5').update(pass).digest('hex');
      const msg = {"type":type,"loginReq":{"strUserName":strUser,"strPasswd":md5Output}};
      return this.sendmessage(JSON.stringify(msg));
    }

    Addlive = (uuid) => {
      const stream = new PassThrough();
      this.liveStreamMap.set(uuid, stream);
      return stream;
    }

    DelLive = (uuid) => {
      this.liveStreamMap.delete(uuid);
    }

    startlive = (id, stream, uuid) => {
      checkStream(uuid);
      this.streamMap.set(uuid, "live");
      this.startMJPEG(uuid);
      const type = "LINK_MI_CMD_STOP_LIVE_CMD";
      const msg = {"type":type,"MistartLiveCmd":{"strId":id,"nStream":stream,"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }

    stoplive = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_BACK_CMD";
      const msg = {"type":type,"MistopLiveCmd":{"struuid":uuid}};
      this.ChildProcess.get(uuid).kill();
      this.ChildProcess.delete(uuid);
      this.streamMap.delete(uuid);
      return this.sendmessage(JSON.stringify(msg));
    }
    
    startplayback = (id, playtime, uuid) => {
      checkStream(uuid);
      this.streamMap.set(uuid, "vod");
      this.startMJPEG(uuid);
      const type = "LINK_MI_CMD_PLAY_BACK_CMD";
      const msg = {"type":type,"MiplayBackCmd":{"strId":id,"nPlaytime":playtime,"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    stopplayback = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_STOP_CMD";
      const msg = {"type":type,"MiplayStopCmd":{"struuid":uuid}};
      this.ChildProcess.get(uuid).kill();
      this.ChildProcess.delete(uuid);
      this.streamMap.delete(uuid);
      return this.sendmessage(JSON.stringify(msg));
    }

    streamstop = (uuid) => {
      checkStream(uuid);
    }
    
    pauseplayback = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_PAUSE_CMD";
      const msg = {"type":type,"MiPlayPauseCmd":{"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    resumeplayback = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_RESUME_CMD";
      const msg = {"type":type,"MiPlayResumeCmd":{"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    seekplayback = (uuid, playtime) => {
      const type = "LINK_MI_CMD_PLAY_SEEK_CMD";
      const msg = {"type":type,"MiplaySeekCmd":{"struuid":uuid, "nPlaytime":playtime}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    speed = (uuid, speed) => {
      const type = "LINK_MI_CMD_PLAY_SEEK_CMD";
      const msg = {"type":type,"MiplaySpeedCmd":{"struuid":uuid, "fSpeed":speed}};
      return this.sendmessage(JSON.stringify(msg));
    }

    processloginresp = (cmd, user, password) => {
        if(cmd.loginResp.bRetNonce && this.logintry <=5) {
          return this.login(user, password, cmd.loginResp.strNonce)
        }
        this.logintry ++;
        if (cmd.loginResp.bRet === true) {
          this.logined = true;
          this.logintry = 0;
        }

    }
    
}

module.exports = VicStream;