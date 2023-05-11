const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")
const EventEmitter = require('events');

class Playback {
  constructor(userid, password) {
      this.Emitter = new EventEmitter();
      this.userid = userid | "admin";
      this.password = password | "admin";
    }

    startserver = () => {
      this.ws = new WebSocket('ws://110.110.10.80:9080/MilinkUserstream');

      // 연결이 열릴 때
      this.ws.onopen = () => {

        console.log('Playback WebSocket Started');
        // 텍스트 데이터 전송

        this.ws.send(this.Login(this.userid, this.password, "nonce"));
      };

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        if(this.logined)
        {
          const data = event.data;
          const sizeofVideoFrameHeader = 4 + 4 + 4 + 4 + 4 + 4;

          const header = data.slice(0, sizeofVideoFrameHeader);
          const buffer = data.slice(sizeofVideoFrameHeader);

          // Convert header fields to original values
          const streamType = Number(header.slice(0, 4));
          const frameType = Number(header.slice(4, 8));
          const secs = Number(header.slice(8, 12));
          const msecs = Number(header.slice(12, 16));
          const dataLen = Number(header.slice(16, 20));
          // video data

          console.log("streamtype : ", streamType, "frameType : " , frameType, "secs : ", secs, "datalen : " , dataLen);
          this.Emitter.emit('id', event.data);
          return;
        }
        const cmd = new LinkProto.LinkCmd().deserializeBinary(event.data);
        console.log(cmd);
        switch (cmd.type())
        {
          case LinkProto.LinkCmdType.LINK_CMD_LOGIN_RESP:
          {
            return processloginresp(cmd, this.userid, this.password);
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
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_CMD_LOGIN_REQ;
      cmd.setType(type);
      
      const pass = strNonce + strPasswd;
    
      const md5Output = crypto.createHash('md5').update(pass).digest('hex');
      const req = new LinkSystem.LinkLoginReq();
      req.setStrusername(strUser);
      req.setStrpasswd(md5Output);
      cmd.setLoginreq(req);
    
      return this.sendmessage(cmd.serializeBinary());
    }
    
    startplayback = (id, playtime) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_BACK_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayBackCmd();
      req.setStrid(id)
      req.setNplaytime(playtime)
    
      cmd.setMiplaybackcmd(req);
    
      return this.sendmessage(cmd.serializeBinary());
    }
    
    stopplayback = (id) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_STOP_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayStopCmd();
      req.setStrid(id)
    
      cmd.setMiplaystopcmd(req);
    
      return this.sendmessage(cmd.serializeBinary());
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
      if(!cmd.hasLoginresp())
        return false;

        const resp =  cmd.getLoginresp();
        if(resp.bretnonce() == true) {
          return login(user, password, resp.getStrnonce())
        }

        if (resp.bret() == true) {
          this.logined = true;
        }
    }
    
}

module.exports = Playback;