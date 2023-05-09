const express = require("express");
const expressWs = require("express-ws");
const session = require('express-session');
const NedbStore = require('connect-nedb-session')(session);
var HLSServer = require("hls-server");

const camera = require("./routes/camera");
const videos = require("./routes/videos");
const onvif = require("./routes/onvif");
const user = require("./routes/user");
const path = require("path");
var cors = require('cors');

process.env.UV_THREADPOOL_SIZE = 16;

require('dotenv').config();

const app = express();

var hls = new HLSServer(app, {
  provider: {
    exists: function (req, callback) { // check if a file exists (always called before the below methods)
      callback(null, true)                 // File exists and is ready to start streaming
      callback(new Error("Server Error!")) // 500 error
      callback(null, false)                // 404 error
    },
    getManifestStream: function (req, callback) { // return the correct .m3u8 file
      // "req" is the http request
      // "callback" must be called with error-first arguments
      callback(null, myNodeStream)
      // or
      callback(new Error("Server error!"), null)
    },
    getSegmentStream: function (req, callback) { // return the correct .ts file
      callback(null, myNodeStream)
    }
  }
})

expressWs(app);
expressWs(camera);

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: new NedbStore({ filename: 'db/SessionDB' }),
  // cookie: {
  //   maxAge: 30 * 60 * 1000 // 30분
  // },
}));

const requireLogin = (req, res, next) => {
  if (!req.session.islogined) {
    res.redirect('/');
  } else {
    next();
  }
};

app.use(cors({
  origin: '*',  // 모든 도메인에서 요청 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 허용하는 HTTP 메소드
  allowedHeaders: ['Content-Type', 'Authorization']  // 허용하는 HTTP 헤더
}));
app.use(express.static(path.join(__dirname, 'hls/')));
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../frontend/my-app/build')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/user", user);
app.use("/camera", requireLogin, camera);
app.use("/videos", requireLogin, videos)
app.use("/onvif", requireLogin, onvif)

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../frontend/my-app/build/index.html'));
});

const server = app.listen(process.env.PORT, ()=>{
    console.log(`server is listening on post ${process.env.PORT}`);
})