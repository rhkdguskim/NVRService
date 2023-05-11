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
        console.log(event.data);
        const cmd = event.data;
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
        this.Emitter.emit('id', event.data);
      };

      // 연결이 닫혔을 때
      this.ws.onclose = () => {
        console.log('Playback WebSocket Stopped');
      };
    }

    sendmessage = (str) => {
      this.ws.send(str);
    }

    jsontostringify = (cmd) => {
      return JSON.stringify(cmd);
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
    
      return sendmessage(jsontostringify(cmd));
    }
    
    startplayback = (id, playtime) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_BACK_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayBackCmd();
      req.setStrid(id)
      req.setNplaytime(playtime)
    
      cmd.setMiplaybackcmd(req);
    
      return sendmessage(jsontostringify(cmd));
    }
    
    stopplayback = (id) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_STOP_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayStopCmd();
      req.setStrid(id)
    
      cmd.setMiplaystopcmd(req);
    
      return sendmessage(jsontostringify(cmd));
    }
    
    pauseplayback = (id) => {
      const cmd = new LinkProto.LinkCmd();
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_PAUSE_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayPauseCmd();
      req.setStrid(id)
    
      cmd.setMiplaypausecmd(req);
    
      return sendmessage(jsontostringify(cmd));
    }
    
    resumeplayback = (id) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_RESUME_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlayResumeCmd();
      req.setStrid(id)
    
      cmd.setMiplayresumecmd(req);
    
      return sendmessage(jsontostringify(cmd));
    }
    
    seekplayback = (id, playtime) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_SEEK_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlaySeekCmd();
      req.setStrid(id)
      req.setNplaytime(playtime)
    
      cmd.setMiplayseekcmd(req);
    
      return sendmessage(jsontostringify(cmd));
    }
    
    speed = (id, speed) => {
      const type = LinkProto.LinkCmdType.LINK_MI_CMD_PLAY_SPEED_CMD;
      cmd.setType(type);
    
      const req = new LinkSystem.LinkMiPlaySpeedCmd();
      req.setStrid(id)
      req.setFspeed(speed)
    
      cmd.setMiplayspeedcmd(req);
    
      return sendmessage(jsontostringify(cmd));
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