const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
var express = require("express");
const expressWs = require("express-ws");
const Datastore = require('nedb');
const router = express.Router();
const cam = require("../classes/camera");
const db = new Datastore({ filename: 'db/CameraDB', autoload: true });
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PassThrough } = require('stream');
const { Console } = require('console');
const { Binary } = require('bson');
const {isValidIPandPORT} = require('../classes/common')
require('dotenv').config();
const debug = process.env.DEBUG === 'true';
const axios = require('axios');
const crypto = require('crypto');

ffmpeg.setFfmpegPath(ffmpeg_static);

expressWs(router);
const MycameraList = new Map();

function ReloadData() {
    db.loadDatabase();
}

async function getVicsCamera(ip, port) {
    const username = 'admin';
    const password = 'admin';
  
    try {
      const response = await axios.get(`http://${ip}:${port}/vapi/GetCamList`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const wwwAuthenticateHeader = error.response.headers['www-authenticate'];
        const realmMatch = wwwAuthenticateHeader.match(/realm="([^"]*)"/);
        const nonceMatch = wwwAuthenticateHeader.match(/nonce="([^"]*)"/);
  
        if (realmMatch && nonceMatch) {
          const ha1 = crypto.createHash('md5').update(`${username}:${realmMatch[1]}:${password}`).digest('hex');
          const ha2 = crypto.createHash('md5').update(`GET:/vapi/GetCamList`).digest('hex');
          const nc = '00000001';
          const cnonce = crypto.randomBytes(16).toString('hex');
          const response = crypto.createHash('md5').update(`${ha1}:${nonceMatch[1]}:${nc}:${cnonce}:auth:${ha2}`).digest('hex');
  
          const authResponse = await axios.get(`http://${ip}:${port}/vapi/GetCamList`, {
            headers: {
              Authorization: `Digest username="${username}", realm="${realmMatch[1]}", nonce="${nonceMatch[1]}", uri="/vapi/GetCamList", response="${response}", qop=auth, nc=${nc}, cnonce="${cnonce}"`,
            },
          });
          return authResponse.data;
        }
      }
      console.error(error);
      throw new Error('Failed to get camera list');
    }
  }


db.find({}, (err, cameras) => {
    if(err)
    {
        console.log("error");
    }
    else
    {
        for(idx in cameras)
        {
            const Camera = new cam(cameras[idx].camname, cameras[idx].ip, cameras[idx].port, cameras[idx].username, cameras[idx].password, cameras[idx].id);
            Camera.SetLiveProfile(cameras[idx].liveprofile);
            Camera.SetProtocolType(cameras[idx].protocoltype);
            Camera.start();
            MycameraList.set(cameras[idx].id, Camera);
        }
    }
})

function CheckSrv(req, res, next) {
    if(!isValidIPandPORT(req.body.ip, req.body.port)) {
        res.status(400).json("Invaild Ip And Port");
        return ;
    }
    else{
        next();
    }
  }

  function CheckCam(req, res, next) {
    const id = req.params.id || req.body.id;
    if(MycameraList.get(id) === undefined) {
        res.status(400).json("Invaild ID");
        return ;
    }
    else {
        next();
    }
  }

router.ws('/ws/:id/', (ws, req) => {
    const camid = req.params.id;
    const uuid = uuidv4();
    //console.log("Camera WebSocket Streaming");
    const camera = MycameraList.get(camid);
    // camera.StartMjpegStream(camera.liveprofile);
    camera.StreamList.set(uuid, new PassThrough());
    const stream = camera.StreamList.get(uuid);

    stream.on('data', (data) => {
         ws.send(data, {binary:true});
      });

    ws.on('close', () => {
      camera.StreamList.delete(uuid);
      //console.log('Client disconnected');
    });

    ws.on('message', (data) => {
        //console.log("From Client : "+data);
    })
  });

router.post('/', CheckSrv, (req, res) => {
    //console.log(req.body)
        
    const id = uuidv4();
    const camera = {
        id:id,
        camname:req.body.camname,
        ip:req.body.ip,
        port:req.body.port,
        username:req.body.username,
        password:req.body.password,
        liveprofile:req.body.liveprofile || "noprofile",
        protocoltype:req.body.protocoltype || "mp4",
        profile:[],
    };
      
    db.insert(camera, (err, result) => {
        if (err) {
            res.status(500).json(err.message);
        }
        else {
            const Camera = new cam(req.body.camname, req.body.ip, req.body.port , req.body.username, req.body.password, id);
            Camera.SetLiveProfile(req.body.liveprofile || "noprofile");
            Camera.SetProtocolType(req.body.protocoltype);
            Camera.start();
            //Camera.StartCameraStream();
            MycameraList.set(id, Camera);
            res.status(201).json(result);
            ReloadData();
        }
    })
});

router.post('/ptz/:id', (req, res) => {
    
});

router.post('/profile',CheckSrv, (req, res) => {
    const Camera = new cam("fake", req.body.ip, req.body.port , req.session.onvifid, req.session.onvifpwd);
    Camera.connect();

    Camera.Emitter.on("offline", () =>
    {
        res.json({Isonline:false});
    })

    Camera.Emitter.on("profile", (profiles) =>
    {
        res.json({Isonline:true, profiles});
    })

});

router.get('/profile/:id',CheckCam, (req, res) => {
    const Camera = MycameraList.get(req.params.id);
    if(Camera === undefined)
        return;
    //console.log(Camera.profilelist);
    if(Camera.profilelist === undefined)
        return;

    res.json(Camera.profilelist);
});

router.get('/vics/:ip', async (req, res) => {
    const ip = req.params.ip;
    const data = await getVicsCamera(ip, 9080);
    res.json(data);
});

router.get('/', (req, res) => {
    db.find({}, (err, cameras) => {
        if (err) {
            res.status(500).json(err.message);
        }
        else{
            res.status(201).json(cameras);
        }
    })
});

router.get('/capture/:id/', CheckCam, (req, res) => {
    camid = req.params.id;
    const camera = MycameraList.get(camid);
    // create a new ffmpeg command
    const command = ffmpeg(camera.rtspurl.get(camera.liveprofile))
      .frames(1) // capture one frame
      //.inputOptions(['-vframes 1'])
      .outputOptions(['-f image2pipe', '-vcodec mjpeg', '-q:v 2'])
      .noAudio()
      .format('image2pipe');
  
    // capture the output from ffmpeg and send in HTTP response
    command.on('error', (err) => {
      console.error(`ffmpeg error: ${err.message}`);
      command.kill();
    })
    .on('end', () => {
       command.kill();
      //console.log('Captured image sent in HTTP response.');
    })
    .pipe(res, { end: true });
    
    //res.set('Content-Type', 'image/jpeg');

  });

router.get('/:id/',CheckCam, (req, res) => {
    const camid = req.params.id;
    const uuid = uuidv4();
    const camera = MycameraList.get(camid);
    
    res.writeHead(200, { // video/mp4
        'Content-Type': 'video/mp4', 
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
        });

    const stream = camera.StartMP4Stream(uuid);
    stream.pipe(res);
    
    req.on('close', () => {
        camera.StreamList.delete(uuid);
    });

});

router.delete('/',CheckCam, (req,res) => {
    db.remove({id:req.body.id}, {}, (err, numRemoved) => {
        if(err) {
            res.status(500).json(err);
        }
        else{
            const camera = MycameraList.get(req.body.id);
            camera.stop();
            MycameraList.delete(req.body.id);
            res.status(201).json(numRemoved.toString());
            ReloadData();
        }
    })
});

router.put('/', CheckSrv, (req,res) => {

    const cam = {
        id:req.body.id,
        camname:req.body.camname,
        ip:req.body.ip,
        port:req.body.port,
        username:req.body.username,
        password:req.body.password,
        liveprofile:req.body.liveprofile,
        protocoltype:req.body.protocoltype,
    };

    //console.log('mod');
    const Camera = MycameraList.get(req.body.id);
    Camera.ip = req.body.ip;
    Camera.port = req.body.port;
    Camera.username = req.body.username;
    Camera.password = req.body.password;
    Camera.cameraname = req.body.camname;
    Camera.SetLiveProfile(req.body.liveprofile);
    Camera.SetProtocolType(req.body.protocoltype);
    Camera.stop();
    Camera.connected = false;
    Camera.start();

    db.update({ _id:req.body._id}, { $set: {
        camname : req.body.camname,
        ip : req.body.ip,
        port : req.body.port,
        username : req.body.username,
        password : req.body.password,
        liveprofile : req.body.liveprofile,
        protocoltype : req.body.protocoltype,
    } } , { upsert: true } , (err, numRemoved) => {
        if(err) {
            res.status(500).json(err);
        }
        else{
            res.status(201).json(numRemoved.toString());
            ReloadData();
        }
        
    })
    
});

module.exports = router;