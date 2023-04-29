const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
var express = require("express");
const expressWs = require("express-ws");
const Datastore = require('nedb');
const router = express.Router();
const cam = require("../classes/camera");
const db = new Datastore({ filename: 'db/CameraDB', autoload: true });


expressWs(router);
const MycameraList = new Map();




db.find({}, (err, cameras) => {
    if(err)
    {
        console.log("error");
    }
    else
    {
        for(idx in cameras)
        {
            const Camera = new cam(cameras[idx].camname, cameras[idx].ip, cameras[idx].port, cameras[idx].username, cameras[idx].password);
            Camera.start();
            MycameraList.set(cameras[idx]._id, Camera);
        }
    }
})

router.ws('/ws/:id/:profile', (ws, req) => {
    ws.binaryType = 'arraybuffer';
    const camid = req.params.id;
    const profile = req.params.profile;
    //console.log(camid);
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
    const camera = {camname:req.body.camname, ip:req.body.ip, port:req.body.port , username:req.body.username, password:req.body.password};
    db.insert(camera, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        }
        else {
            const Camera = new cam(req.body.camname, req.body.ip, req.body.port , req.body.username, req.body.password);
            Camera.start();
            MycameraList.set(result._id, Camera);
            res.status(201).send(result);
        }
    })
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

router.get('/:id', (req, res) => {
    res.setHeader('Connection', 'Keep-Alive');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');


    camera.getFFmpegStream(profile);
    const stream = camera.ffmpegStreams.get(profile);
    const ffmpegInstance = 
        ffmpeg("BigBuckBunny.mp4")
        .setFfmpegPath(ffmpeg_static)
        .videoCodec('copy')
        .format('mp4')
        .outputOptions(['-tune', 'zerolatency'])
        .outputOptions('-movflags', 'frag_keyframe+empty_moov+default_base_moof')
        .on('start', (err) => {
            console.log("Streaming Started");
        })
        .on('error', (err) => {
            console.error('Error:', err.message);
        })
        .on('end', () => {
            console.log('FFmpeg instance closed');
        })
    ffmpegInstance.pipe(res);

    req.on('close', () => {
        console.log('Client disconnected');
      });

});

router.get('/:id/:profile', (req, res) => {
    res.setHeader('Connection', 'Keep-Alive');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');


    const camid = req.params.id;
    const profile = req.params.profile;

    const camera = MycameraList.get(camid);

    if (!camera) {
        console.error(`Camera ${camid} not found`);
        return;
      }

    camera.getFFmpegStream(profile);
    const stream = camera.ffmpegStreams.get(profile);
    stream.pipe(res);

    req.on('close', () => {
        console.log('Client disconnected');
    });

});

router.delete('/', (req,res) => {
    db.remove({_id:req.body.id}, {}, (err, numRemoved) => {
        if(err) {
            res.status(500).send(err.message);
        }
        else{
            MycameraList.delete(req.body.id);
            res.status(201).send(numRemoved.toString());
        }
    })
});

router.put('/:id', (req,res) => {
    db.update({ _id:req.params.id}, {$set : req.body}, (err, numRemoved) => {
        if(err) {
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(numRemoved.toString());
        }
    })
});

module.exports = router