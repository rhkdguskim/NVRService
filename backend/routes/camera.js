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

require('dotenv').config();
const debug = process.env.DEBUG === 'true';

ffmpeg.setFfmpegPath(ffmpeg_static);

expressWs(router);
const MycameraList = new Map();

function ReloadData() {
    db.loadDatabase();
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
        console.log("From Client : "+data);
    })
  });

router.post('/', (req, res) => {
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
            res.status(500).send(err.message);
        }
        else {
            const Camera = new cam(req.body.camname, req.body.ip, req.body.port , req.body.username, req.body.password, id);
            Camera.SetLiveProfile(req.body.liveprofile || "noprofile");
            Camera.SetProtocolType(req.body.protocoltype);
            Camera.start();
            //Camera.StartCameraStream();
            MycameraList.set(id, Camera);
            res.status(201).send(result);
        }
    })
});

router.post('/profile', (req, res) => {
    const Camera = new cam("fake", req.body.ip, req.body.port , req.session.onvifid, req.session.onvifpwd);
    Camera.connect();

    Camera.Emitter.on("offline", () =>
    {
        res.send({Isonline:false});
    })

    Camera.Emitter.on("profile", (profiles) =>
    {
        res.send({Isonline:true, profiles});
    })

});

router.get('/profile/:id', (req, res) => {
    const Camera = MycameraList.get(req.params.id);
    if(Camera === undefined)
        return;
    //console.log(Camera.profilelist);
    if(Camera.profilelist === undefined)
        return;

    res.send(Camera.profilelist);
});

router.get('/', (req, res) => {
    db.find({}, (err, cameras) => {
        if (err) {
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(cameras);
        }
    })
});

router.get('/capture/:id/', (req, res) => {
    //res.set('Content-Type', 'image/jpeg');
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
      res.status(500).send('Error capturing image.');
    })
    .on('end', () => {
      console.log('Captured image sent in HTTP response.');
    })
    .pipe(res, { end: true });
    
    //res.set('Content-Type', 'image/jpeg');

  });

router.get('/:id/', (req, res) => {
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

router.delete('/', (req,res) => {
    db.remove({id:req.body.id}, {}, (err, numRemoved) => {
        if(err) {
            res.status(500).send(err.message);
        }
        else{
            const camera = MycameraList.get(req.body.id);
            camera.stop();
            MycameraList.delete(req.body.id);
            res.status(201).send(numRemoved.toString());
        }
    })
});

router.put('/', (req,res) => {

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

    console.log('mod');
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
            console.log(err.message);
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(numRemoved.toString());
        }
        ReloadData();
    })
    
});

module.exports = router;