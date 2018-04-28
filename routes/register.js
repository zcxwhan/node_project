var express = require('express');
var router = express.Router();
const mongo = require("mongodb").MongoClient;
var crypto = require("crypto"); //加密模块
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render("register");
});

router.post('/confirm', function(req, res, next) {
 let body=req.body;
 mongol(body,res);
 function mongol(body,res){
     mongo.connect("mongodb://10.9.153.180:27017",(err,client)=>{
         if(err){ //服务器错误
             res.send("0");
             client.close();
             throw err;
         }
         let odb = client.db("wb");
         odb.collection("users")
         .find({username:body.username})
         .toArray((err,result)=>{
             if(result.length>=1){  //存在用户名  返回1
                 res.send("1");
             }else{        //可以注册
                 const cipher = crypto.createCipher('aes192', "a passworld");
                 let encrypted = cipher.update(body.password, 'utf8', 'hex');
                 encrypted += cipher.final('hex');
                 var usrobj={
                     username:body.username,
                     password:encrypted
                 }
                 odb.collection("users")
                 .insert(usrobj,(err,result)=>{
                     if(err){
                         res.send("0");
                         client.close();
                         throw err;
                     }
                     res.send(JSON.stringify(usrobj));
                     client.close();
                 });
             }
         });
     });
 }
  
 });


module.exports = router;
