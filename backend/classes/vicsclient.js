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
      this.logintry = 0;
      this.connected = false;
    }

    startserver = () => {
      this.ws = new WebSocket('ws://127.0.0.1:9080/linkproto');

      // 연결이 열릴 때
      this.ws.onopen = () => {

        console.log('Vic Client WebSocket Started');
        // 텍스트 데이터 전송
        this.connected = true;
        this.ws.send(this.login(this.userid, this.password, "nonce"));
      };

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        // Additional error handling logic can be added here
      });

      // 메시지를 받았을 때
      this.ws.onmessage = (event) => {
        const cmd = JSON.parse(event.data);
        switch (cmd.type)
        {
          case 'LINK_CMD_ADD_CAM_RESP' :
          {
            return this.processaddcamResp(cmd);
            break;
          }

          case 'LINK_CMD_CAM_LIST_RESP' :
          {
            return this.processcamlistresp(cmd);
          }

          case 'LINK_CMD_DEL_CAM_RESP' :
          {
            return this.processdelcamresp(cmd);
            break;
          }
          
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

          case 'LINK_CMD_CAM_ONLINE_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
              this.Emitter.emit('camonline', cmd.camIdNotify.strId);
          }

          case 'LINK_CMD_CAM_OFFLINE_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
              this.Emitter.emit('camoffline', cmd.camIdNotify.strId);
              break;
          }

          case 'LINK_CMD_CAM_REC_ON_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
              this.Emitter.emit('camrecon', cmd.camIdNotify.strId);
              break;
          }

          case 'LINK_CMD_CAM_REC_OFF_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
              this.Emitter.emit('camrecoff', cmd.camIdNotify.strId);
              break;
          }
      
          default:
               break;
        };
      };

      // 연결이 닫혔을 때
      this.ws.onclose = () => {
        console.log('Playback WebSocket Stopped');
        this.connected = false;
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
      const msg = {"type":cmd,
      "hasRecReq":{"strId":id,
      "cList":{"cHasRec":HasRec}}}
      this.sendmessage(JSON.stringify(msg));
    }

    getCameraList = () => {
      const cmd = "LINK_CMD_CAM_LIST_REQ";
      const msg = {"type":cmd, "camListReq":{"bAll":true}};
      this.sendmessage(JSON.stringify(msg));
    }

    getcameracallback = () =>{
      const cmd = "LINK_CMD_REG_NOTIFY_REQ";
      const msg = {"type":cmd, "regNotifyReq":{}};
      this.sendmessage(JSON.stringify(msg));
    }

    addcamera = (camera) => {
      const cmd = "LINK_CMD_ADD_CAM_REQ";
      const msg =  {"type":cmd,"addCamReq":{"cCam":{"strId":camera.id,"strName":camera.name,"nType":"VID_ONVIF_S","strIP":camera.ip,"strPort":camera.port,"strUser":camera.username,"strPasswd":camera.userpassword,"strONVIFAddress":"/onvif/device_service","strRTSPUrl":"rtsp://110.110.10.0:554/Streami","nConnectType":"VID_CONNECT_TCP","cRecSched":["44241a90-8927-4907-a3d1-f32f29c2266e"],"strSched":"\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002\u0002"}}}
      this.sendmessage(JSON.stringify(msg));
    }

    delcamera = (id) => {
      const cmd = "LINK_CMD_DEL_CAM_REQ";
      const msg = {"type":cmd,"delCamReq":{"strId":id}}
      this.sendmessage(JSON.stringify(msg));
    }

    processloginresp = (cmd, user, password) => {
      if(cmd.loginResp.bRetNonce && this.logintry <=5) {
        return this.login(user, password, cmd.loginResp.strNonce)
      }
      this.logintry ++;
      if (cmd.loginResp.bRet === true) {
        this.logined = true;
        this.logintry = 0;
        this.getCameraList();
        this.getcameracallback();
      }
    }

    processsearchrecordresp = (cmd) => {
      if(cmd.searchRecResp.cList.cList)
        this.Emitter.emit('dayrec', cmd.searchRecResp.cList.cList);
      else
        this.Emitter.emit('dayrec', []);
      }
    
    processhasrecordresp = (cmd) => {
      if(cmd.hasRecResp.cList.cHasRec)
        this.Emitter.emit('monthrec', cmd.hasRecResp.cList.cHasRec);
      else
        this.Emitter.emit('monthrec', []);    
    }

    processcamlistresp = (cmd) => {
    if(cmd.camListResp.cList)
      this.Emitter.emit('cameralist', cmd.camListResp.cList);
    else
      this.Emitter.emit('cameralist', []);    
    }

    processaddcamResp = (cmd) => {
      console.log(cmd)
    }

    processdelcamresp = (cmd) => {
      console.log(cmd)
    }

  }

module.exports = VicsClient;