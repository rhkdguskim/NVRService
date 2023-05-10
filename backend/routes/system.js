var express = require("express");
const expressWs = require("express-ws");
const diskinfo = require('node-disk-info');
const os = require('os-utils');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Datastore = require('nedb');
const db = new Datastore({ filename: 'db/DiskDB', autoload: true });

const router = express.Router();

expressWs(router);

const DiskList = new Map();

db.find({}, (err, diskList) => {
    if(err)
    {
        console.log("error");
    }
    else
    {
        for(idx in diskList)
        {
            diskinfo.getDiskInfo()
            .then(disks => {
              const disk = disks.filter( disk => diskList[idx].mounted === disk._mounted);
              DiskList.set(diskList[idx].id, disk);
            })
            .catch(err => {
                res.status(500).send(err.message);
            });
            
        }
    }
})

function ReloadData() {
    db.loadDatabase();
}

router.ws('/data', (ws, req) => {

    const sendUsage = () => {
        os.cpuUsage((cpuUsage) => {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memory = Math.round((usedMemory / totalMemory) * 100);
        
        let total = 0;
        let free = 0;

        DiskList.forEach((values, key) => {
            total =+ values[0]._blocks;
        })

        DiskList.forEach((values, key) => {
            free =+ values[0]._available;
        })

        const used = total - free;
        const disk = Math.round((used / total) * 100) || 0;
        const cpu = Math.round((cpuUsage) * 100)
            ws.send(JSON.stringify({ cpu, memory, disk }));
        });
    };

    const intervalId = setInterval(sendUsage, 1000);

    ws.on('close', () => {
        clearInterval(intervalId);
    });
});

router.get('/sdisk', (req, res) => {
    diskinfo.getDiskInfo()
    .then(disks => {
      // Log the list of disks
      const newData = disks.map((item) => ({
        ...item,
        id: uuidv4(),
      }));

      res.status(201).send(newData);
    })
    .catch(err => {
        res.status(500).send(err.message);
    });
});

router.get('/disk', (req, res) => {
    db.find({}, (err, disklist) => {
        if (err) {
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(disklist);
        }
    })
});

router.post('/disk', (req, res) => {
    const id = uuidv4();
    const disk = {
        id:id,
        name:req.body.name,
        limit:req.body.limit,
        mounted:req.body.mounted,
    };
      
    db.insert(disk, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        }
        else {
            res.status(201).send(result);
            ReloadData();
        }
    })
});

router.delete('/disk', (req,res) => {
    db.remove({id:req.body.id}, {}, (err, numRemoved) => {
        if(err) {
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(numRemoved.toString());
            ReloadData();
        }
    })
});

router.put('/disk', (req,res) => {
    db.update({ id:req.body.id}, { $set: { name:req.body.name, limit:req.body.limit, mounted:req.body.mounted} } , { upsert: true } , (err, numRemoved) => {
        if(err) {
            console.log(err.message);
            res.status(500).send(err.message);
        }
        else{
            res.status(201).send(numRemoved.toString());
            ReloadData();
        }
    })
    
});

module.exports = router;