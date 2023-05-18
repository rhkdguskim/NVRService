var express = require("express");
const expressWs = require("express-ws");
const VicStream = require("../classes/vicsstream");
const VicsLink = require("../classes/vicslink");
const router = express.Router();
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpeg_static);
expressWs(router);

const vicsstreamws = new VicStream("110.110.10.102", "9080","admin","admin");
const vicslinkws = new VicsLink("110.110.10.102", "9080","admin", "admin");

vicsstreamws.connect();
vicslinkws.connect();

vicslinkws.Emitter.on('cameralist', (data) => {
    
    data.cVidCamera.map((item) => {
        //vicsstreamws.startlive(item.strId, 2, item.strId);
        if(item.bOnline)
        {
            console.log(item.strId);
            vicsstreamws.startlive(item.strId, 1, item.strId)
            vicsstreamws.startlive(item.strId, 2, item.strId)
        }
    })
});
vicslinkws.Emitter.on('camonline', (data) => {
    console.log("camonline ",data);
    vicsstreamws.startlive(data, 1, data)
    vicsstreamws.startlive(data, 2, data)
});

vicslinkws.Emitter.on('camoffline', (data) => {
    console.log("camoffline ",data);
    vicsstreamws.stoplive(data, 1)
    vicsstreamws.stoplive(data, 2)
});

vicslinkws.Emitter.on('camrecoff', (data) => {
    console.log("camrecoff ",data);
});


vicslinkws.Emitter.on('camrecon', (data) => {
    console.log("camrecon ",data);
});



router.ws('/live/:camid/', (ws, req) => {
    const camid = req.params.camid;

    if(!vicsstreamws.connected)
        vicsstreamws.connect();
    else
        ws.close();

    const mainstream = vicsstreamws.vodStreamMap.get(frameHeader.UUID).stream;

    mainstream.on("data", (data) => {
        ws.send(data);
    })

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        
    });
});

router.ws('/play/:uuid/', (ws, req) => {
    const uuid = req.params.uuid;

    if(!vicsstreamws.connected)
        vicsstreamws.connect();
    else
        ws.close();

    const stream = vicsstreamws.createVodStreamMap(uuid);

    stream.on("data", (data) => {
        ws.send(data);
    })

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        vicsstreamws.deleteVodStreamMap(uuid);
    });
});

router.ws('/timestamp/:uuid', (ws, req) => {
    if(!vicsstreamws.connected)
        vicsstreamws.connect();
    else
        ws.close();
    
    vicsstreamws.Emitter.on(`timestamp/${req.params.uuid}`, (data) => {
        ws.send(data.time);
    });

    ws.on("message ", (data) => {
        
    })
});

router.get('startlive/:id/:stream/:uuid', (req, res) => {
    vicsstreamws.startlive(req.params.id, req.params.stream, req.params.uuid);
    res.status(201).json({result:true});
})

router.get('stoplive/:id/:stream/:uuid', (req, res) => {
    vicsstreamws.stoplive(req.params.uuid);
    res.status(201).json({result:true});
})

router.post('/playback/:id/:playtime/:uuid', (req, res) => {
    vicsstreamws.startplayback(req.params.id, req.params.playtime, req.params.uuid);
    res.status(201).json({result:true});
});

router.post('/pause/:uuid', (req, res) => {
    vicsstreamws.pauseplayback(req.params.uuid);
    res.status(201).json({result:true});
});

router.post('/resume/:uuid', (req, res) => {
    vicsstreamws.resumeplayback(req.params.uuid);
    res.status(201).json({result:true});
});

router.post('/seek/:uuid/:playtime', (req, res) => {
    vicsstreamws.seekplayback(req.params.uuid, req.params.playtime);
    res.status(201).json({result:true});
});

router.post('/speed/:uuid/:speed', (req, res) => {
    vicsstreamws.speed(req.params.uuid, req.params.speed);
    res.status(201).json({result:true});
});

router.post('/ptz/:', (req, res) => {
    const camid = req.body.camid;
    const action = req.body.action;
    const speed = req.body.speed;

    vicsstreamws.Ptz(camid, action, speed);
    res.status(201).json({result:true});
});

router.post('/capture/', (req, res) => {
    const camid = req.body.camid;
    const height = req.body.height || 1980;
    const width = req.body.width || 1080;

    if(vicsstreamws.LiveSubCameraMap.has(camid)) {
        const mainstream = vicsstreamws.LiveSubCameraMap.get(camid);

        res.setHeader('Content-Type', 'image/jpeg');
    
        ffmpeg()
        .input(mainstream)
        .outputFormat('image2pipe')
        .outputOptions('-preset', 'ultrafast')
        .outputOptions('-pix_fmt', 'yuv420p')
        .outputOptions('-s', `${height}x${width}`)
        .frames(1)
        .outputOptions('-threads', '3')
        .on('end', () => {
        })  
        .on('error', (err) => {
          console.error('Error converting frame:', err);
          res.sendStatus(500); // Send an error response if conversion fails
        })
        .pipe(res)
    }
    else {
        res.sendStatus(500); // Send an error response if conversion fails
    }
});

const CheckWebSocket = (req, res, next) => {
    if(!vicsstreamws.connected)
        vicsstreamws.connect();

    if(!vicslinkws.connected)
        vicslinkws.connect();

    next();
}

const recMonth = (req, res, next) => {
    const id = req.body.id;
    const year = req.body.year;
    const month = req.body.month;
    const day = req.body.day;

    if(day === undefined) {
        //console.log("Monthly Data");
        const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
        const dayInMonth = months[req.body.month - 1];
        const recmap = [];
        
        for (i = 1; i <= dayInMonth; i++)
        {
            const date = new Date(year, month-1, i, 0, 0, 0);
            const newdate = Math.floor(date.getTime() / 1000); // UNIX Timestamp
            const numString = i.toString();
            //console.log(newdate);
            recmap.push({"nId":`${numString}`,"nStart":newdate,"nEnd":newdate+86399,"nType":673197088})
        }

        vicslinkws.searchhasrec(id, recmap);

        const monthRecHandler = (data) => {
            res.status(201).json(data);
            res.end();
            vicslinkws.Emitter.off('monthrec', monthRecHandler); // 이벤트 리스너 제거
        }
        // playback 리스트 전달.

        vicslinkws.Emitter.on('monthrec', monthRecHandler);
    }
    else {
        next();
    }
}

router.post('/rec', CheckWebSocket, recMonth, (req, res) => {
    const id = req.body.id;
    const year = req.body.year;
    const month = req.body.month;
    const day = req.body.day;

    const date = new Date(year, month-1, day, 0, 0, 0);
    const newdate = Math.floor(date.getTime() / 1000); // UNIX Timestamp
    // playback 리스트 전달.
    vicslinkws.searchrec(id, newdate, newdate + 86399);

    const dayRecHandler = (data) => {
        res.status(201).json(data);
        res.end();
        vicslinkws.Emitter.off('dayrec', dayRecHandler); // 이벤트 리스너 제거
    };

    vicslinkws.Emitter.on('dayrec', dayRecHandler);
})

module.exports = router;