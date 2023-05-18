const VicsClient = require('./vicsclient');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const { spawn } = require('child_process');

ffmpeg.setFfmpegPath(ffmpeg_static);

class VicStream extends VicsClient {
      constructor(ip, port, username, password) {
        super(ip, port, username, password, "MilinkUserstream")
        super.callbackfunc = this.callbackMessage;
        this.vodStreamMap = new Map();
        this.LiveMainCameraMap = new Map();
        this.LiveSubCameraMap = new Map();
        this.LiveCameraBufData = new Map();
    }

    timestamp = (uuid, sec) => {
      if(this.oldTime !== sec)
      {
        this.oldTime = sec;
        this.Emitter.emit(`timestamp/${uuid}`, {time:sec});
      }
    }

    callbackMessage = (data) => {
      if(this.logined)
        {
          const message = data;
          const frameHeader = {
            streamType: Number(message.readInt32BE(0)),
            frameType: Number(message.readInt32BE(4)),
            seq: Number(message.readUInt32BE(8)),
            secs: Number(message.readUInt32BE(12)),
            msecs: Number(message.readUInt32BE(16)),
            dataLen: message.readInt32BE(20),
            UUID: message.slice(24, 60).toString(),
          };
          const videodata = message.slice(61);
          //timestamp callback
          this.timestamp(frameHeader.UUID, frameHeader.secs);
          //livecallback
          if(this.LiveMainCameraMap.has(frameHeader.UUID)) {
            
            this.LiveMainCameraMap.get(frameHeader.UUID).write(videodata);
            return;
          }

          if(this.LiveSubCameraMap.has(frameHeader.UUID)) {
            this.LiveCameraBufData.set(frameHeader.UUID, videodata);
            this.LiveSubCameraMap.get(frameHeader.UUID).write(videodata);
            return;
          }

          //vod callback
          if(this.vodStreamMap.has(frameHeader.UUID)) {
            this.vodStreamMap.get(frameHeader.UUID).write(videodata);
            return;
          }
        }
    }

    createVodStreamMap = (uuid) => {
      const stream = new PassThrough({ highWaterMark: 30000 })
      stream.setMaxListeners(20);
      this.vodStreamMap.set(uuid, stream);
      return stream;
    }

    deleteVodStreamMap = (uuid) => {
      this.vodStreamMap.delete(uuid);
    }


    startlive = (id, streamnum) => {
      const stream = new PassThrough({ highWaterMark: 30000 })
      stream.setMaxListeners(20);
      if(streamnum === 1) { // Main
        this.LiveMainCameraMap.set(id, stream);
        const type = "LINK_MI_CMD_START_LIVE_CMD";
        const msg = {"type":type,"MistartLiveCmd":{"strId":id,"nStream":streamnum,"struuid":id}};
        return this.sendmessage(JSON.stringify(msg));
      }
      else{ // Sub
        this.LiveSubCameraMap.set(id, stream);
        const type = "LINK_MI_CMD_START_LIVE_CMD";
        const msg = {"type":type,"MistartLiveCmd":{"strId":id,"nStream":streamnum,"struuid":id}};
        return this.sendmessage(JSON.stringify(msg));
      }

    }

    stoplive = (id, streamnum) => {
      if(streamnum === 1) {
        this.LiveMainCameraMap.delete(id);
        const type = "LINK_MI_CMD_STOP_LIVE_CMD";
        const msg = {"type":type,"MistopLiveCmd":{"struuid":id},"nStream":streamnum};
        return this.sendmessage(JSON.stringify(msg));
      }
      else {
        this.LiveMainCameraMap.delete(id);
        const type = "LINK_MI_CMD_STOP_LIVE_CMD";
        const msg = {"type":type,"MistopLiveCmd":{"struuid":id},"nStream":streamnum};
        return this.sendmessage(JSON.stringify(msg));
      }

    }
    
    startplayback = (id, playtime, uuid) => {
      const type = "LINK_MI_CMD_PLAY_BACK_CMD";
      const msg = {"type":type,"MiplayBackCmd":{"strId":id,"nPlaytime":playtime,"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }
    
    stopplayback = (uuid) => {
      const type = "LINK_MI_CMD_PLAY_STOP_CMD";
      const msg = {"type":type,"MiplayStopCmd":{"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
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
    
}

module.exports = VicStream;