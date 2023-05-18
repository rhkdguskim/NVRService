const VicsClient = require('./vicsclient');

class VicsLink extends VicsClient {

    constructor(ip, port, username, password) {
        super(ip, port, username, password, "linkproto")
        super.callbackfunc = this.callbackMessage;
        super.processlogin = this.callbackprocesslogin;

        this.CameraList = new Map();
        this.SearchedCamera = new Map();
    }

    callbackprocesslogin = () => {
      this.getCameraList();
      this.getcameracallback();
      this.SearchStart();
    }
    
    callbackMessage = (data) => {
      const cmd = JSON.parse(data);
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

          case 'LINK_CMD_CAM_ADD_NOTIFY' :
          {
            return this.processcamaddnotify(cmd);
             break;
          }

          case 'LINK_CMD_CAM_DEL_NOTIFY' :
          {
            return this.processcamdelnotify(cmd);
            break;
          }

          case 'LINK_CMD_CAM_SEARCHED_NOTIFY' :
          {
            return this.processcamsearchdnotify(cmd);
          }

          case 'LINK_CMD_CAM_ONLINE_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
            {
              const cameraData = this.CameraList.get(cmd.camIdNotify.strId);
              cameraData.bOnline = true;
              this.CameraList.set(cmd.camIdNotify.strId, cameraData);
              return this.Emitter.emit('camonline', cmd.camIdNotify.strId);
              
            }
            break;
          }

          case 'LINK_CMD_CAM_OFFLINE_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
            {
              const cameraData = this.CameraList.get(cmd.camIdNotify.strId);
              cameraData.bOnline = false;
              this.CameraList.set(cmd.camIdNotify.strId, cameraData);
              return this.Emitter.emit('camoffline', cmd.camIdNotify.strId);
            }
              break;
          }

          case 'LINK_CMD_CAM_REC_ON_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
            {
              const cameraData = this.CameraList.get(cmd.camIdNotify.strId);
              cameraData.bRec = true;
              this.CameraList.set(cmd.camIdNotify.strId, cameraData);
              this.Emitter.emit('camrecon', cmd.camIdNotify.strId);
            }
              break;
          }

          case 'LINK_CMD_CAM_REC_OFF_NOTIFY':
          {
            if(cmd.camIdNotify.strId)
            {
              const cameraData = this.CameraList.get(cmd.camIdNotify.strId);
              cameraData.bRec = false;
              this.CameraList.set(cmd.camIdNotify.strId, cameraData);
              this.Emitter.emit('camrecoff', cmd.camIdNotify.strId);
            }
              
              break;
          }
      
          default:
               break;
        }
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

    SearchStart = () => {
      const cmd = "LINK_CMD_CAM_SEARCH_START_REQ";
      const msg = {"type":cmd,"camSearchStartReq":{}}
      this.sendmessage(JSON.stringify(msg));
    }

    Ptz = (camid, action, speed) => {
      const cmd = "LINK_CMD_PTZ_CMD";
      const msg = {"type":cmd,"ptzCmd":{"strId":camid,"nAction":action,"nParam":speed}}
      this.sendmessage(JSON.stringify(msg));
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
    if(cmd.camListResp.cList) {
      this.Emitter.emit('cameralist', cmd.camListResp.cList);
      cmd.camListResp.cList.cVidCamera.map((item) => {
        this.CameraList.set(item.strId, item);
      })

    }
    else {
      this.Emitter.emit('cameralist', []);    
    }
      
    }

    processaddcamResp = (cmd) => {
      console.log("Add", cmd);
    }

    processdelcamresp = (cmd) => {
      console.log("Delete", cmd);
    }
    processcamaddnotify = (cmd) => {
      const cam = cmd.camAddNotify.cCam;
      this.CameraList.set(cam.strId, cam);
    }

    processcamdelnotify = (cmd) => {
      this.CameraList.delete(cmd.camIdNotify.strId);
    }

    processcamsearchdnotify = (cmd) => {
      this.SearchedCamera.set(cmd.camSearchedNotify.strIp, cmd.camSearchedNotify)
    }

}

module.exports = VicsLink;