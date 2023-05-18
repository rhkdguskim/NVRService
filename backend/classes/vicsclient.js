const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")
const EventEmitter = require('events');

class VicsClient {
  constructor(ip, port, username, password, path) {
      this.ip = ip;
      this.port = port;
      this.Emitter = new EventEmitter();
      this.username = username;
      this.password = password;
      this.logintry = 0;
      this.connected = false;
      this.path = path;
      this.callbackfunc = null;
      this.processlogin = null;
    }
    connect = () => {
      this.ws = new WebSocket(`ws://${this.ip}:${this.port}/${this.path}`);

      // 연결이 열릴 때
      this.ws.onopen = () => {

        console.log('VICS WebSocket Started');
        // 텍스트 데이터 전송
        this.connected = true;
        this.ws.send(this.login(this.username, this.password, "nonce"));
      };

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        // Additional error handling logic can be added here
      });

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {

        try{
          const cmd = JSON.parse(event.data);
          switch (cmd.type)
        { 
          case 'LINK_CMD_LOGIN_RESP':
          {
            return this.processloginresp(cmd, this.userid, this.password);
            break;
          }
      
          default:
          {
            this.callbackfunc(event.data);
            break;
          }
               
        };
        } catch (err) {
          this.callbackfunc(event.data);
        } finally {
        }
      };
      

      // 연결이 닫혔을 때
      this.ws.onclose = () => {
        console.log('VICS WebSocket Stopped');
        this.connected = false;
      };
    }

    disconnect = () => {
      this.ws.close();
    }

    sendmessage = (msg) => {
      this.ws.send(msg);
    }

    login = (strUser, strPasswd, strNonce) => {
      const type = "LINK_CMD_LOGIN_REQ";
      const pass = strNonce + strPasswd;
    
      const md5Output = crypto.createHash('md5').update(pass).digest('hex');
      const msg = {"type":type,"loginReq":{"strUserName":strUser,"strPasswd":md5Output}};
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
        
        if(this.processlogin)
          this.processlogin();
      }
    }

  }

module.exports = VicsClient;