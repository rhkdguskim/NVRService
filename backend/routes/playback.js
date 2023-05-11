var express = require("express");
const expressWs = require("express-ws");
const Playback = require("../classes/playback");
const VicsClient = require("../classes/vicsclient");
const router = express.Router();

expressWs(router);

const playbackws = new Playback();
const vicsclientws = new VicsClient();

router.ws('/', (ws, req) => {
    ws.on("message ", (data) => {
        switch(data.cmd)
        {
            case 1:
                playbackws.startplayback(data.id, data.playtime);
                break;
            case 2:
                break;
            case 3:
                break;
            default:
                break;
        }
        
        playbackws.Emitter.on("id", (data) => {
            console.log(data);
            ws.send(data);
        });
        
    })

    ws.on('close', () => {
        clearInterval(intervalId);
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    // playback 리스트 전달.
    vicsclientws.searchhasrec(id);
});

module.exports = router;