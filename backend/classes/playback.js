const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")
const EventEmitter = require('events');
const { spawn } = require('child_process');
const ffmpeg_static = require('ffmpeg-static');

class Playback {
  constructor(userid, password) {
      this.Emitter = new EventEmitter();
      this.userid = userid;
      this.password = password;
      this.ChildProcess = new Map();
      //console.log(this.userid, this.password)
    }

    startserver = () => {
      this.ws = new WebSocket('ws://127.0.0.1:9080/MilinkUserstream');
      // 연결이 열릴 때
      this.ws.onopen = () => {
        console.log('Playback WebSocket Started');
        // 텍스트 데이터 전송

        this.ws.send(this.login(this.userid, this.password, "nonce"));
      };

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        
        if(this.logined)
        {
          const frameHeaderSize = 61; /* size of MiVideoFrameHeader structure in bytes */;
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
          
          //console.log(frameHeader);
          //console.log(data);

          if(!this.ChildProcess.has(frameHeader.UUID))
          {
            console.log("spawned!!");
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

            this.ChildProcess.set(frameHeader.UUID, childprocess);
            
            childprocess.stderr.on('data', (data) => {
              console.log(data.toString());
            });

            this.Emitter.emit(frameHeader.UUID, {start:true});

            childprocess.stdout.on('data', (data) => {
              //console.log(frameHeader.UUID);
              this.Emitter.emit(frameHeader.UUID, {start:true, data:data});
            });
          }
          //console.log(this.ChildProcess.get(frameHeader.UUID));
          this.ChildProcess.get(frameHeader.UUID).stdin.write(data);
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
        console.log(json);
        
      };

      // 연결이 닫혔을 때
      this.ws.onclose = () => {
        console.log('Playback WebSocket Stopped');
      };
    }

    sendmessage = (str) => {
      this.ws.send(str);
    }

    login = (strUser, strPasswd, strNonce) => {
      const type = "LINK_CMD_LOGIN_REQ";
      const pass = strNonce + strPasswd;
    
      const md5Output = crypto.createHash('md5').update(pass).digest('hex');
      const msg = {"type":type,"loginReq":{"strUserName":strUser,"strPasswd":md5Output}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    startplayback = (id, playtime, uuid) => {
      const type = "LINK_MI_CMD_PLAY_BACK_CMD";

      const msg = {"type":type,"MiplayBackCmd":{"strId":id,"nPlaytime":playtime,"struuid":uuid}};
    
      return this.sendmessage(JSON.stringify(msg));
    }
    
    stopplayback = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_STOP_CMD";

      const msg = {"type":type,"MiplayStopCmd":{"struuid":uuid}};
      this.ChildProcess.get(uuid).kill();
      this.ChildProcess.delete(uuid);
      return this.sendmessage(JSON.stringify(msg));
    }
    
    pauseplayback = (id) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_PAUSE_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayPauseCmd();
      req.setStrid(id)
    
      cmd.setMiplaypausecmd(req);
    
      return this.sendmessage(cmd.serializeBinary());
    }
    
    resumeplayback = (id) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_RESUME_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayResumeCmd();
      req.setStrid(id)
    
      cmd.setMiplayresumecmd(req);

      return this.sendmessage(cmd.serializeBinary());
    }
    
    seekplayback = (id, playtime) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_SEEK_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlaySeekCmd();
      req.setStrid(id)
      req.setNplaytime(playtime)
    
      cmd.setMiplayseekcmd(req);
    
      return this.sendmessage(cmd.serializeBinary());
    }
    
    speed = (id, speed) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_SPEED_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlaySpeedCmd();
      req.setStrid(id)
      req.setFspeed(speed)
    
      cmd.setMiplayspeedcmd(req);
    
      return this.sendmessage(cmd.serializeBinary());
    }

    processloginresp = (cmd, user, password) => {
        if(cmd.loginResp.bRetNonce) {
          return this.login(user, password, cmd.loginResp.strNonce)
        }

        if (cmd.loginResp.bRet === true) {
          this.logined = true;
        }
    }
    
}

module.exports = Playback;