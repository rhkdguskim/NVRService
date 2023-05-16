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
        this.streamMap = new Map();
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

          if(!this.cmd) {
            console.log("Onle One");
            this.cmd = ffmpeg()
            .input(this.streamMap.get(frameHeader.UUID).stream)
            .on('start', function(err) {
              console.log('stared: ' + err.message);
            })
            .on('error', function(err) {
              console.log('An error occurred: ' + err.message);
            })
            .on('end', function() {
              console.log('Processing finished !');
            });
  
            this.cmd.ffprobe(0, function(err, data) {
              if (err) {
                console.log('Error occurred during ffprobe: ' + err.message);
              } else {
                console.log(data);
              }
            });
          }

          this.timestamp(frameHeader.UUID, frameHeader.secs);
          if(this.streamMap.has(frameHeader.UUID)) {
            this.streamMap.get(frameHeader.UUID).stream.write(videodata);
          }
        }
    }

    createStreamMap = (uuid, isvod) => {
      const stream = new PassThrough()

      if(isvod)
        this.streamMap.set(uuid, {type:"vod", stream: stream});
      else
        this.streamMap.set(uuid, {type:"live", stream: stream});
      
      return stream;
    }

    deleteStreamMap = (uuid) => {
      this.streamMap.delete(uuid);
    }

    startlive = (id, stream, uuid) => {
      const type = "LINK_MI_CMD_START_LIVE_CMD";
      const msg = {"type":type,"MistartLiveCmd":{"strId":id,"nStream":stream,"struuid":uuid}};
      return this.sendmessage(JSON.stringify(msg));
    }

    stoplive = (uuid) => {
      const type = "LINK_MI_CMD_STOP_LIVE_CMD";
      const msg = {"type":type,"MistopLiveCmd":{"struuid":uuid}};
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