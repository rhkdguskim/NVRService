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
    console.log("Camera WebSocket Streaming");

    const camera = MycameraList.get(camid);

    const args = [
        '-i',
        `BigBuckBunny.mp4`, //`${camera.rtspurl.get(camera.liveprofile)}`
        '-f', 'mpegts', '-codec:v', 'mpeg1video', '-bf', '0', '-codec:a', 'mp2', '-r', '30',
        'pipe:1',
      ];
      
      const proc = spawn(ffmpeg_static, args);
      
      proc.stdout.on('data', (data) => {
        //console.log(data);
        ws.send(data);
      });

        proc.stderr.on('data', (data) => {
            console.log(data);
      });

    ws.on('close', () => {
      console.log('Client disconnected');
      proc.kill();
    });

    ws.on('message', (data) => {
        console.log(data);
    })
  });

router.post('/', (req, res) => {
    console.log(req.body)
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

router.get('/hls/:id/', (req, res) => {
    console.log(`${req.params.id}/play.m3u8`);
    res.redirect(`../../../${req.params.id}/play.m3u8`);
})

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

router.get('/mjpeg', (req, res) => {
    //const camid = req.params.id;
    
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
      });


    //const camera = MycameraList.get(camid);
    const command = ffmpeg("BigBuckBunny.mp4")
    //.inputFormat('mp4')
    .videoCodec('mjpeg')
    .outputFormat('mjpeg')
    .format('mjpeg')
    //.format('rtsp')
    .outputOptions([
        '-r 25', // Set the output frame rate
        '-s 640x480', // Set the output resolution
        '-f mjpeg', // Force MJPEG output format
        '-fflags nobuffer', // Disable buffer flushing
        '-flush_packets 1' // Enable packet flushing
    ]).on('error', (err, stdout, stderr) => {
        console.error(`Error: ${err.message}`);
        console.error(`ffmpeg stdout: ${stdout}`);
        console.error(`ffmpeg stderr: ${stderr}`);
      }).on('error', (err, stdout, stderr) => {
        console.error(`Error: ${err.message}`);
        console.error(`ffmpeg stdout: ${stdout}`);
        console.error(`ffmpeg stderr: ${stderr}`);
      })
      command.pipe(res);

});

router.get('/:id/', (req, res) => {
    const camid = req.params.id;
    const uuid = uuidv4();
    res.writeHead(200, { // video/mp4
        'Content-Type': 'video/mp4', 
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
      });
     const camera = MycameraList.get(camid);
     const stream = camera.StartMP4Stream(uuid);
     stream.pipe(res);

    req.on('close', () => {
        camera.StreamList.delete(uuid);
      });
});

router.delete('/', (req,res) => {
    db.remove({_id:req.body.id}, {}, (err, numRemoved) => {
        if(err) {
            res.status(500).send(err.message);
        }
        else{
            //MycameraList.get(req.body.id).stop();
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