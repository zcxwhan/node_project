var express = require('express');
var router = express.Router();
const mongo = require("mongodb").MongoClient;
var crypto = require("crypto"); //加密模块
var fs = require("fs");
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render("login");
});

router.post('/confirm', function(req, res, next) {
  //获取前端传来用户名密码并加密
   let username=req.body.username;
   let password=req.body.password;
   password = enCrypted(password);
   var tocken   = req.body.tocken;
   //连接数据库
   var user  = mongoConnect("wb","users");
   user.then(confirmLogin,dberror);   
  //promise成功后逻辑
  function confirmLogin(obj) {
      obj.coll.find({ username: username}).toArray((err,result)=>{
          if(err){//数据库错误
              res.send("0");
              obj.client.close();
              throw err;
          }
          if(result.length<1){  //用户名不存在 --用户名或密码错误
              res.send("1");
          }else if(result.length>1){
              res.send("0");   //数据库错误
              obj.client.close();
          }else{
              if (result[0].password === password){
                  result[0] = Object.assign(result[0],{state:"success"});//合并对象
                  var _tocken = createTocken(username); //创建tocken
                  res.cookie("WBID",_tocken);  //向前台写入cookie
                   //后台创建或者更新tocken
                  var mongo_tocken  = mongoConnect("wb","tockens");
                  mongo_tocken.then(function(obj){
                     obj.coll.find({username:username}).toArray(function(err,result1){
                       if(err){
                         throw err;
                         obj.client.close();
                       }
                       if(result1.length==1){//更新
                        obj.coll.update({username:username},{$set:{tocken:_tocken}});
                       }else if(result1.length==0){ //创建
                        obj.coll.insert({username:username,tocken:_tocken});
                       }
                       if (tocken=="true") {//前端传来保存密码15天
                        var d = new Date();
                        d.setDate( d.getDate()+15 );	// 过期时间为：当前的日期加几天
                        res.cookie("WBID",_tocken,{expires:d});  //向前台写入cookie 覆盖为15天
                       }
                       res.json(result[0]);   //返给前台的值
                       obj.client.close();
                     });
                   });
                 
              }else{
                  res.send("1");
              }
          }
      })  
  
  }
  //promise失败后逻辑
  function dberror(err) {
      res.send("0")
  } 
});

 //连接数据库
 function mongoConnect(database,collection){
  return new Promise(function(succ,failed){
    var url = "mongodb://10.9.153.180:27017";
    mongo.connect(url, (err, client) => {
      if (err) {
        failed()
      };
      var odb = client.db(database);
      var coll = odb.collection(collection);  //这里return不出去 并且存在异步问题 所以用到promise
      succ({coll:coll,client:client});
    })
  })
}
//创建tocken
function createTocken(username) {
  var header = {//token类型和加密方式
    "typ":"JWT",   //标准
    "alg":"sha1"
  }
  var header_hex = objToHex(header); //转hex编码

  var payload = {
    "iss":"zcx.com",
    "exp":new Date().getTime() + 100000,
    "name":username
  }
  var payload_hex = objToHex(payload);

  var pem = fs.readFileSync(__dirname + "/../server.pem");//读取密码文件;
  var key = pem.toString("ascii");//转换成ascii吗;
  const hash = crypto.createHmac('sha1', key)//创建加密方式：
    .update(header_hex + " " + payload_hex)  //加密数据：
    .digest('hex'); //加密转码
     
  // console.log(hash);
  var tocken = header_hex + "." + payload_hex + "."+ hash;   //前两部分可以不要
  return tocken;
}
 //无秘钥加密
 function enCrypted(password){
  //创建一个密码 stream => 参数 为加密方式 参数2 密文中的一个后缀;
  const cipher = crypto.createCipher('aes192', "a passworld");
  //载入一个密码，并规定输入和输出值;
  let encrypted = cipher.update(password, 'utf8', 'hex');
  //最后输出数据 ， 及后缀。
  encrypted += cipher.final('hex');
  
  return encrypted;
}
//转hex编码形式
function objToHex(obj){
  var string = JSON.stringify(obj);
  var buff = Buffer.from(string);
  return  buff.toString("hex")
} 

module.exports = router;
