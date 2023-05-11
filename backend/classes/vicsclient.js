const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")
const EventEmitter = require('events');

class VicsClient {
  constructor(userid, password) {
      this.Emitter = new EventEmitter();
      this.userid = userid | "admin";
      this.password = password | "admin";
    }

    startserver = () => {
      this.ws = new WebSocket('ws://110.110.10.80:9080/');

      // 연결이 열릴 때
      this.ws.onopen = () => {

        console.log('Playback WebSocket Started');
        // 텍스트 데이터 전송

        this.ws.send(this.Login(this.userid, this.password, "nonce"));
      };

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        const cmd = new LinkProto.LinkCmd().deserializeBinary(event.data);
        console.log(cmd)
        switch (cmd.type())
        {
            case LinkProto.LinkCmdType.LINK_CMD_LOGIN_RESP:
            {
                return processloginresp(cmd, this.userid, this.password);
                break;
            }

            case LinkProto.LinkCmdType.LINK_CMD_SEARCH_RECORD_RESP:
            {
                return processsearchrecordresp(cmd);
                break;
            }

            case LinkProto.LinkCmdType.LINK_CMD_HAS_RECORD_RESP:
            {
                return processhasrecordresp(cmd);
                break;
            }

      
          default:
               break;
        };
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

    searchrec = (id, start, end, rtype) => {
        const cmd = new LinkProto.LinkCmd();
        const type = LinkProto.LinkCmdType.LINK_CMD_SEARCH_RECORD_REQ;
        cmd.setType(type);

        const req = new LinkSystem.LinkSearchRecordReq();
        req.setStrid(id);
        req.setNstart(start);
        req.setNend(end);
        req.setNtype(rtype);

        cmd.setSearchrecreq(req);
      
        return this.sendmessage(cmd.serializeBinary());
    }

    searchhasrec = (id) => {
        const cmd = new LinkProto.LinkCmd();
        const type = LinkProto.LinkCmdType.LINK_CMD_HAS_RECORD_REQ;
        cmd.setType(type);

        const req = new LinkSystem.LinkHasRecordReq();
        req.setStrid(id);
        
        cmd.setHasrecreq(req);
      
        return this.sendmessage(cmd.serializeBinary());
    }

    processsearchrecordresp = (cmd) => {
        if(!cmd.hasSearchrecresp())
            return false;
        
        const map = new Map();
        const resp = cmd.getSearchrecresp();
        clist = resp.getChasrecList();
        clist.map(item => {
            
            itemNew1.id = item.nid,
            itemNew1.start = item.nstart;
            itemNew1.end = item.nend;
            itemNew1.type = item.ntype;
            map.set(item.nid, itemNew1);
        })

        this.Emitter.emit('hasrec', map);
    
      return true;
      }
    
    processhasrecordresp = (cmd) => {
        if(!cmd.hasHasrecresp())
            return false;
        const map = new Map();
        const resp = cmd.getHasrecresp();
        clist = resp.getChasrecList();
        clist.map(item => {
            
            itemNew1.id = item.nid,
            itemNew1.start = item.nstart;
            itemNew1.end = item.nend;
            itemNew1.type = item.ntype;
            itemNew1.has = item.bhas;
            map.set(item.nid, itemNew1);
        })

        this.Emitter.emit('hasrec', map);
    
      return true;
    }

    processloginresp = (cmd, user, password) => {
      if(!cmd.hasLoginresp())
        return false;

        const resp =  cmd.getLoginresp();
        if(resp.bretnonce === true) {
          return login(user, password, resp.getStrnonce())
        }

        if (resp.bret === true) {
          this.logined = true;
        }
    }
    
}

module.exports = VicsClient;