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

const MongoClient = require('mongodb').MongoClient;

const url = "mongodb://localhost:27017/";
const dbName = "StreamServer";

expressWs(router);
const MycameraList = new Map();

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    
    console.log("hi");
    // 데이터 조회
    db.collection('admin').find({}).toArray(function(err, result) {
      if (err) throw err;

      console.log(result);
      console.log("hi");
      
      // 서버 작업 수행
    });
  
    // 클라이언트 객체 닫기
    db.close();
  });

// db.find({}, (err, cameras) => {
//     if(err)
//     {
//         console.log("error");
//     }
//     else
//     {
//         for(idx in cameras)
//         {
//             const Camera = new cam(cameras[idx].camname, cameras[idx].ip, cameras[idx].port, cameras[idx].username, cameras[idx].password, cameras[idx].id);
//             Camera.SetLiveProfile(cameras[idx].liveprofile);
//             Camera.SetProtocolType(cameras[idx].protocoltype);
//             Camera.start();
//             Camera.StartCameraStream();
//             MycameraList.set(cameras[idx].id, Camera);
//         }
//     }
// })

router.ws('/ws/:id/:profile', (ws, req) => {
    const camid = req.params.id;
    const profile = req.params.profile;
    console.log("websocketStreaming");
    //console.log(profile);

    const camera = MycameraList.get(camid);

    if (!camera) {
        console.error(`Camera ${camid} not found`);
        return;
      }

    camera.getFFmpegStream(profile);
    const stream = camera.ffmpegStreams.get(profile);

    stream.on('data', (data) => {
      ws.send(data);
    });

    stream.on('end', () => {
        console.log("Streaming ended");
        ws.close();
    });

    ws.on('close', () => {
      console.log('Client disconnected');
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

    MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        db.collection("camera").insertOne(
            { camera },
            function(err, result) {
              if (err) throw err;
              console.log("Document inserted");
              res.status(201).send(result);
            }
          );
      
        client.close();
      });



      
    // db.insert(camera, (err, result) => {
    //     if (err) {
    //         res.status(500).send(err.message);
    //     }
    //     else {
    //         const Camera = new cam(req.body.camname, req.body.ip, req.body.port , req.body.username, req.body.password, id);
    //         Camera.SetLiveProfile(req.body.liveprofile || "noprofile");
    //         Camera.SetProtocolType(req.body.protocoltype);
    //         Camera.start();
    //         Camera.StartCameraStream();
    //         MycameraList.set(id, Camera);
    //         res.status(201).send(result);
    //     }
    // })
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
    //console.log(Camera.profilelist);
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

router.get('/:id/', (req, res) => {

    const camid = req.params.id;

    res.setHeader('Connection', 'Keep-Alive');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Transfer-Encoding', 'chunked');

     const camera = MycameraList.get(camid);
    // const uuid = uuidv4();
    // //camera.AddLiveStreamMap(uuid);
    
    // const stream = new PassThrough();
    // camera.livestreamMap.set(camid, stream);
    // //const stream = camera.livestreamMap.get(uuid);
    // //stream.pipe(res);
    // stream.on('data', (data) => {
    //     console.log(data);
    //     res.write(data);
    //   });

    // req.on('close', () => {
    //     camera.DelLiveStreamMap(uuid);
    //     console.log('Client disconnected');
    // });

    const args = [
        '-i',
        `${camera.rtspurl.get(camera.liveprofile)}`, //`${camera.rtspurl.get(camera.liveprofile)}`
        '-vcodec',
        'copy',
        '-f',
        'mp4',
        `-preset`, `ultrafast`,
        `-tune`, `zerolatency`,
        '-movflags',
        'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1',
      ];
      
      const proc = spawn(ffmpeg_static, args);
      
      proc.stdout.on('data', (data) => {
        res.write(data);
      });

    req.on('close', () => {
        proc.kill();
        console.log('Req Client disconnected');
    });

    res.on('close', () => {
        proc.kill();
        res.end();
        console.log('Res Client disconnected');
    });
});

router.delete('/', (req,res) => {

    MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        db.collection("camera").deleteOne(
            { id: req.body.id },
            function(err, result) {
              if (err) throw err;
              console.log(`${result.deletedCount} document deleted`);
              res.status(201).send(numRemoved.toString());
            }
          );
      
        client.close();
      });

    // db.remove({_id:req.body.id}, {}, (err, numRemoved) => {
    //     if(err) {
    //         res.status(500).send(err.message);
    //     }
    //     else{
    //         MycameraList.delete(req.body.id);
    //         res.status(201).send(numRemoved.toString());
    //     }
    // })
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
    Camera.SetLiveProfile(req.body.liveprofile);
    Camera.SetProtocolType(req.body.protocoltype);

    MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        db.collection("camera").updateOne(
            { id: req.body.id },
            { $set: { cam } },
            function(err, result) {
              if (err) throw err;
              console.log(`${result.modifiedCount} document updated`);
              res.status(201).send(result.modifiedCount.toString());
            }
          );
      
        client.close();
      });

    // db.update({ _id:req.body._id}, { $set: {
    //     camname : req.body.camname,
    //     ip : req.body.ip,
    //     port : req.body.port,
    //     username : req.body.username,
    //     password : req.body.password,
    //     liveprofile : req.body.liveprofile,
    //     protocoltype : req.body.protocoltype,
    // } } , { upsert: true } , (err, numRemoved) => {
    //     if(err) {
    //         console.log(err.message);
    //         res.status(500).send(err.message);
    //     }
    //     else{
    //         res.status(201).send(numRemoved.toString());
    //     }
    // })
    
});

module.exports = router;