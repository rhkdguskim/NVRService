var express = require("express");
const expressWs = require("express-ws");
const Playback = require("../classes/playback");
const VicsClient = require("../classes/vicsclient");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

expressWs(router);

const playbackws = new Playback("admin","admin");
const vicsclientws = new VicsClient("admin", "admin");
const uuid = uuidv4();

playbackws.startserver();
vicsclientws.startserver();

router.ws('/:id/:playtime', (ws, req) => {
    if(!playbackws.connected)
        playbackws.startserver();
    else
        ws.close();

    //console.log(req.params.id, req.params.playtime);
    const uuid = uuidv4();
    playbackws.startplayback(req.params.id, req.params.playtime, uuid);
    playbackws.Emitter.on(uuid, (data) => {
        ws.send(data.data);
    });

    ws.on("message ", (data) => {
        
        
    })

    ws.on('close', () => {
        playbackws.stopplayback(uuid);
    });
});

const CheckWebSocket = (req, res, next) => {
    if(!playbackws.connected)
        playbackws.startserver();

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