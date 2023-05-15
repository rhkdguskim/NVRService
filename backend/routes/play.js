var express = require("express");
const expressWs = require("express-ws");
const VicStream = require("../classes/vicsstream");
const VicsLink = require("../classes/vicslink");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

expressWs(router);

const vicsstreamws = new VicStream("127.0.0.1", "9080","admin","admin");
const vicslinkws = new VicsLink("127.0.0.1", "9080","admin", "admin");
const uuid = uuidv4();

vicsstreamws.connect();
vicslinkws.connect();

vicslinkws.Emitter.on('cameralist', (data) => {
    //console.log(data.cVidCamera);

    data.cVidCamera.map((item) => {
        if(item.bOnline)
            console.log(item.strId);
    })
});

vicslinkws.Emitter.on('camonline', (data) => {
    console.log(data);
});

vicslinkws.Emitter.on('camoffline', (data) => {
    console.log(data);
});

vicslinkws.Emitter.on('camrecon', (data) => {
    console.log(data);
});

vicslinkws.Emitter.on('camrecoff', (data) => {
    console.log(data);
});

router.ws('/play/:isvod/:uuid/', (ws, req) => {
    const uuid = req.params.uuid;

    if(!vicsstreamws.connected)
        vicsstreamws.connect();
    else
        ws.close();

    const stream = vicsstreamws.createStreamMap(uuid);

    stream.on("data", (data) => {
        ws.send(data);
    })

    ws.on("message ", (data) => {
        
    })

    ws.on('close', () => {
        vicsstreamws.deleteStreamMap(uuid);
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