const express = require("express");
const expressWs = require("express-ws");
const session = require('express-session');
const NedbStore = require('connect-nedb-session')(session);

const camera = require("./routes/camera");
const videos = require("./routes/videos");
const onvif = require("./routes/onvif");
const user = require("./routes/user");
const path = require("path");
var cors = require('cors');

const PORT = 8000;
const app = express();

app.use(session({
  secret: 'rhkdguskim',
  resave: false,
  saveUninitialized: false,
  store: new NedbStore({ filename: 'db/SessionDB' })
}));

const requireLogin = (req, res, next) => {
  if (!req.session.islogined) {
    res.redirect('/');
  } else {
    next();
  }
};

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

app.use(cors());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../frontend/my-app/build/index.html'));
});

app.listen(PORT, ()=>{
    console.log(`server is listening on post ${PORT}`);
})