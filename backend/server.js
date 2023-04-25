const express = require("express");
const camera = require("./routes/camera");
const videos = require("./routes/videos");
const onvif = require("./routes/onvif");
const path = require("path");
var cors = require('cors');

const PORT = 8000;
const app = express();

app.use(express.static(path.join(__dirname, '../frontend/my-app/build')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/camera",camera);
app.use("/videos", videos)
app.use("/onvif", onvif)
app.use(cors());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../frontend/my-app/build/index.html'));
});

app.listen(PORT, ()=>{
    console.log(`server is listening on post ${PORT}`);
})