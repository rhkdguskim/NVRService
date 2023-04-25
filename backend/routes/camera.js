var express = require("express");
const Datastore = require('nedb');
const router = express.Router();
const cam = require("../classes/camera");

const db = new Datastore({ filename: 'db/CameraDB', autoload: true });

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
            MycameraList[cameras[idx]._id] = Camera;
        }
    }
})

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
            MycameraList[req.body._id] = Camera;
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
    const instance = MycameraList[req.params.id];
    if(instance)
    {
        if(instance.connected)
        {
            console.log("PipeStream Start " + req.params.id);
            instance.PipeStream(res);
        }
        else
        {
            console.log("Connection Error " + req.params.id);
            res.status(500).send("Connection Error");
        }
    }
    else
    {
        console.log("Instance is null " + req.params.id);
        res.status(500).send("Instance is null");
    }
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