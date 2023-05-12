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
      this.userid = userid;
      this.password = password;
    }

    startserver = () => {
      this.ws = new WebSocket('ws://127.0.0.1:9080/linkproto');

      // 연결이 열릴 때
      this.ws.onopen = () => {

        console.log('Vic Client WebSocket Started');
        // 텍스트 데이터 전송

        this.ws.send(this.login(this.userid, this.password, "nonce"));
      };

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        const cmd = JSON.parse(event.data);
        switch (cmd.type)
        {
            case 'LINK_CMD_LOGIN_RESP':
            {
              return this.processloginresp(cmd, this.userid, this.password);
              break;
            }

            case 'LINK_CMD_SEARCH_RECORD_RESP':
            {
                return this.processsearchrecordresp(cmd);
                break;
            }

            case 'LINK_CMD_HAS_RECORD_RESP':
            {
                return this.processhasrecordresp(cmd);
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
      const type = "LINK_CMD_LOGIN_REQ";
      const pass = strNonce + strPasswd;
    
      const md5Output = crypto.createHash('md5').update(pass).digest('hex');
      const msg = {"type":type,"loginReq":{"strUserName":strUser,"strPasswd":md5Output}};
      return this.sendmessage(JSON.stringify(msg));
    }

    searchrec = (id, start, end) => {
        const cmd = "LINK_CMD_SEARCH_RECORD_REQ";
        const msg = {"type":cmd,"searchRecReq":{"strId":id,"nStart":start,"nEnd":end,"nType":-1}}
        this.sendmessage(JSON.stringify(msg));
    }

    searchhasrec = (id, HasRec) => {
      const cmd = "LINK_CMD_HAS_RECORD_REQ";
      const msg = {"type":"LINK_CMD_HAS_RECORD_REQ",
      "hasRecReq":{"strId":id,
      "cList":{"cHasRec":HasRec}}}
      this.sendmessage(JSON.stringify(msg));
    }

    processsearchrecordresp = (cmd) => {
      console.log(cmd);
      if(cmd.searchRecResp.cList.cList)
        this.Emitter.emit('dayrec', cmd.searchRecResp.cList.cList);
      else
        this.Emitter.emit('dayrec', []);
      }
    
    processhasrecordresp = (cmd) => {
      console.log(cmd.hasRecResp.cList.cHasRec);
      
      if(cmd.hasRecResp.cList.cHasRec)
        this.Emitter.emit('monthrec', cmd.hasRecResp.cList.cHasRec);
      else
        this.Emitter.emit('monthrec', []);    
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

module.exports = VicsClient;