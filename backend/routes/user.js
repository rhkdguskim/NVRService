var express = require("express");
const crypto = require('crypto');
const Datastore = require("nedb");
const router = express.Router();


const db = new Datastore({ filename: 'db/UserDB', autoload: true });

router.post("/login", (req, res) => {
    db.find({key : req.body.username}, (err, user) => {
        if(err)
        {
            console.log("there is no users!!");
        }
        else
        {
            if(Object.keys(user).length)
            {
                const hash = crypto.createHash('md5').update(req.body.password).digest('hex');
                if(user[0].password === hash) {
                   req.session.islogined = true;
                   req.session.username = req.body.username;
                   req.session.onvifid = user[0].onvifid;
                   req.session.onvifpwd = user[0].onvifpwd;
                   res.send({Logined:true});
               }
               else {
                res.send({Logined:false, err:"password"});
               }
            }
            else{
                res.send({Logined:false, err:"nouser"});
            }
            
        }
        
    })
 })

 router.post("/logout", (req, res) => {
    req.session.islogined = false;
    res.redirect("/user");
 })

 router.get("/logout", (req, res) => {
    req.session.islogined = false;
    res.redirect("/user");
 })


 router.get("/", (req, res) => {
    res.send({user : {username:req.session.username, onvifid:req.session.onvifid, onvifpwd:req.session.onvifpwd} , islogined: req.session.islogined});
 })

 router.post("/", (req, res) => {
    // 비밀번호 해싱하기
    console.log(req.body.username);
    db.find({key : req.body.username}, (err, user) => {
        console.log(Object.keys(user).length);
        if(!Object.keys(user).length)
        {
            const hash = crypto.createHash('md5').update(req.body.password).digest('hex');
            const user = {
            username : req.body.username,
            password : hash,
            onvifid  : req.body.onvifid,
            onvifpwd : req.body.onvifpwd,
            key : req.body.username
            }
        
            db.insert(user, (err, result) => {
            if (err) {
                res.status(500).send(err.message);
            }
            else {
                req.session.islogined = true;
                res.status(201).send(result);
            }
            });
        }
        else
        {
            res.status(201).send("User is already exsist");
        }
    });
    
 })

 router.delete("/", (req, res) => {
    // 비밀번호 해싱하기
    if(req.session.islogined === true)
    {
        db.remove({ key: req.body.username }, {}, (err, numRemoved) => {
            if(err)
            {
                console.log(err.message);
            }
            res.status(201).send(numRemoved);
            return;
          });
    }

    res.status(500).send("로그인이 필요합니다!");
    
 })


module.exports = router;