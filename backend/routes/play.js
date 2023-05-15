var express = require("express");
const expressWs = require("express-ws");
const VicStream = require("../classes/vicsstream");
const VicsClient = require("../classes/vicsclient");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

expressWs(router);

const vicsstreamws = new VicStream("admin","admin");
const vicsclientws = new VicsClient("admin", "admin");
const uuid = uuidv4();

vicsstreamws.startserver();
vicsclientws.startserver();

vicsclientws.Emitter.on('cameralist', (data) => {
    //console.log(data.cVidCamera);

    data.cVidCamera.map((item) => {
        if(item.bOnline)
            console.log(item.strId);
    })
});

vicsclientws.Emitter.on('camonline', (data) => {
    console.log(data);
});

vicsclientws.Emitter.on('camoffline', (data) => {
    console.log(data);
});

vicsclientws.Emitter.on('camrecon', (data) => {
    console.log(data);
});

vicsclientws.Emitter.on('camrecoff', (data) => {
    console.log(data);
});


router.ws('/playback/:uuid', (ws, req) => {
    if(!vicsstreamws.connected)
        vicsstreamws.startserver();
    else
        ws.close();
    
    vicsstreamws.Emitter.on(`play/${req.params.uuid}`, (data) => {
        ws.send(data.data);
    });

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        vicsstreamws.streamstop(uuid);
    });
});

router.ws('/mainstream/:uuid', (ws, req) => {
    if(!vicsstreamws.connected)
        vicsstreamws.startserver();
    else
        ws.close();
    
    const stream = vicsstreamws.Addlive(req.params.uuid);

    stream.on('data', (data) => {
        ws.send(data.data);
    });

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        vicsstreamws.DelLive(uuid);
    });
});

router.ws('/substream/:uuid', (ws, req) => {
    if(!vicsstreamws.connected)
        vicsstreamws.startserver();
    else
        ws.close();
    
    const stream = vicsstreamws.Addlive(req.params.uuid);

    stream.on('data', (data) => {
        ws.send(data.data);
    });

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        vicsstreamws.DelLive(uuid);
    });
});

router.ws('/timestamp/:uuid', (ws, req) => {
    if(!vicsstreamws.connected)
        vicsstreamws.startserver();
    else
        ws.close();
    
    vicsstreamws.Emitter.on(`timestamp/${req.params.uuid}`, (data) => {
        ws.send(data.time);
    });

    ws.on("message ", (data) => {
        
    })
});

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


const CheckWebSocket = (req, res, next) => {
    if(!vicsstreamws.connected)
        vicsstreamws.startserver();

    if(!vicsclientws.connected)
        vicsclientws.startserver();

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

        vicsclientws.searchhasrec(id, recmap);

        const monthRecHandler = (data) => {
            res.status(201).json(data);
            res.end();
            vicsclientws.Emitter.off('monthrec', monthRecHandler); // 이벤트 리스너 제거
        }
        // playback 리스트 전달.

        vicsclientws.Emitter.on('monthrec', monthRecHandler);
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
    vicsclientws.searchrec(id, newdate, newdate + 86399);

    const dayRecHandler = (data) => {
        res.status(201).json(data);
        res.end();
        vicsclientws.Emitter.off('dayrec', dayRecHandler); // 이벤트 리스너 제거
    };

    vicsclientws.Emitter.on('dayrec', dayRecHandler);
})

module.exports = router;