var express = require('express');
var router = express.Router();
const mongo = require("mongodb").MongoClient;
var crypto = require("crypto"); //加密模块
var fs = require("fs");
var qs=require("querystring");
//登录后台入口
router.get('/admin', function(req, res, next) {
   // res.render("admin");                  
   res.sendFile(__dirname+"/html/admin.html");  //或者render views里面的ejs
});

//后台管理系统路由 主页
router.get('/admin/admin', function(req, res, next) {
    var cookie=qs.parse(req.headers.cookie,"; ","=");
    if(cookie.ADMINID){
        confirmTocken(cookie.ADMINID)  //确定tocken是否正确
        .then(success,errors);
    }else{
        res.sendFile(__dirname+"/html/admin.html");  //cookie不存在直接渲染到admin登录入口
    }

    function success(username){//tocken正确连list库
       res.render("index",{username:username});
        
    }
    function errors(err){ //tocken不正确throw错误
        throw err;
    }
   
});
//加载商品列表
router.get('/admin/admin/goodslist', function(req, res, next) {
    var list  = mongoConnect("wb","list");
    list.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
           obj.coll.find({}).toArray((err,result)=>{
               if(err){//数据库错误
                   res.send("0");
                   obj.client.close();
                   throw err;
               }
               result = Object.assign({state:"success"},{data:result});//合并对象
               res.send(result);
               
           })  

       }
       //promise失败后逻辑
       function dberror(err) {
           res.send("0");
       }  
});

//加载用户列表
router.get('/admin/admin/userlist', function(req, res, next) {
    var users  = mongoConnect("wb","users");
    users.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
           obj.coll.find({}).toArray((err,result)=>{
               if(err){//数据库错误
                   res.send("0");
                   obj.client.close();
                   throw err;
               }
               result = Object.assign({state:"success"},{data:result});//合并对象
               res.send(result);
               
           })  

       }
       //promise失败后逻辑
       function dberror(err) {
           res.send("0");
       }  
});


//ADMIN  tocken确认
function confirmTocken(tocken){
    return new Promise(function(succ,failed){
      var payload=tocken.split(".")[1];
      var username=hexToObj(payload).name;
      // console.log(username);
      var url = "mongodb://10.9.153.180:27017";
      mongo.connect(url, (err, client) => {
          if (err) {
            throw err;
          };
          var odb = client.db("wb");
          var coll = odb.collection("admintockens").find({username:username}).toArray(function(err,result){
            if(result[0].tocken==tocken){
              succ(username);
              //console.log("有效tocken");
            }else{
              //console.log("无效tocken");
              failed("无效tocken");
            }
          });
      });
    });
  }

//验证后台系统用户名密码
router.post('/admin/confirm', function(req, res, next) {  //注意：/admin 有/
    //获取前端传来用户名密码并加密
     let username=req.body.username;
     let password=req.body.password;
   //连接数据库
     var user  = mongoConnect("wb","controls");
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
                        res.cookie("ADMINID",_tocken);  //向前台写入cookie
                        //后台创建或者更新tocken
                        var mongo_tocken  = mongoConnect("wb","admintockens");
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

//select 查询数据
router.get('/admin/admin/select', function(req, res, next) {
    //连接数据库
    var list  = mongoConnect("wb","list");
    list.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
          if(req.query.type=="bianhao"){
            obj.coll.find({ id: parseInt(req.query.val)}).toArray((err,result)=>{
                if(err){//数据库错误
                    res.send("0");
                    obj.client.close();
                    throw err;
                }
                if(result.length==1){  //查询到了
                    result = Object.assign({state:"success"},{data:result});//合并对象
                    res.send( result);
                }else if(result.length>1){
                    res.send("0");   //数据库错误
                    obj.client.close();
                }else{  //没有查到
                    res.send("1");
                    obj.client.close();
                }
            })  
 
          }else if(req.query.type=="pricegt"){
            obj.coll.find({ price: {$gt:parseInt(req.query.val)}}).toArray((err,result)=>{
                console.log(result)
                if(err){//数据库错误
                    res.send("0");
                    obj.client.close();
                    throw err;
                }
                if(result.length>=1){  //查询到了
                    result = Object.assign({state:"success"},{data:result});//合并对象
                    res.send( result);
                }else{  //没有查到
                    res.send("1");
                    obj.client.close();
                }
            })  
          }else if(req.query.type=="pricelt"){
            obj.coll.find({ price: {$lt:parseInt(req.query.val)}}).toArray((err,result)=>{
                if(err){//数据库错误
                    res.send("0");
                    obj.client.close();
                    throw err;
                }
                if(result.length>=1){  //查询到了
                    result = Object.assign({state:"success"},{data:result});//合并对象
                    res.send( result);
                }else{  //没有查到
                    res.send("1");
                    obj.client.close();
                }
            });  
          }

       }
       //promise失败后逻辑
       function dberror(err) {
           res.send("0")
       }  
});


//add 增加数据
router.post('/admin/admin/add', function(req, res, next) {
    //连接数据库
    var list  = mongoConnect("wb","list");
    list.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
           obj.coll.find({ id: parseInt(req.body.id)}).toArray((err,result)=>{
               if(err){//数据库错误
                   res.send("0");
                   obj.client.close();
                   throw err;
               }
               if(result.length==1){  //id存在
                   res.send("1");
               }else if(result.length>1){
                   res.send("0");   //数据库错误
                   obj.client.close();
               }else{
                mongoConnect("wb","list").then(function(obj1){
                    req.body.id=parseInt(req.body.id);
                    req.body.price=parseInt(req.body.price);
                    req.body.sailnum=parseInt(req.body.sailnum);
                    req.body.comment=parseInt(req.body.comment);
                    obj1.coll.insert(req.body,(err,result)=>{
                        res.send(JSON.stringify(req.body));
                    });
                }); 
               }
           })  

       }
       //promise失败后逻辑
       function dberror(err) {
           res.send("0")
       }  
});



//update 更新数据
router.post('/admin/admin/update', function(req, res, next) {
    //连接数据库
    var list  = mongoConnect("wb","list");
    list.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
           req.body.id=parseInt(req.body.id);
           req.body.price=parseInt(req.body.price);
           req.body.sailnum=parseInt(req.body.sailnum);
           req.body.comment=parseInt(req.body.comment);
           obj.coll.update({ id: parseInt(req.body.id)},{$set:req.body},(err,result)=>{
               if(err){//数据库错误
                   res.send("0");
                   obj.client.close();
                   throw err;
               }else{
                   res.send("2");
                   obj.client.close();
               }
               
           });  

       }
       //promise失败后逻辑
       function dberror(err) {
           res.send("0")
       }  
});


//delete 删除数据
router.get('/admin/admin/del', function(req, res, next) {
    //连接数据库
    var list  = mongoConnect("wb","list");
    list.then(confirmLogin,dberror);  
    //promise成功后逻辑
       function confirmLogin(obj) {
           newID=parseInt(req.query.id);
           obj.coll.remove({ id: newID},(err,result)=>{
               if(err){//数据库错误
                   res.send("0");
                   obj.client.close();
                   throw err;
               }else{
                   res.send("2");
                   obj.client.close();
               }
               
           });  

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
          failed(err);
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
      "iss":"admin.com",
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
  //转hex编码形式
function objToHex(obj){
    var string = JSON.stringify(obj);
    var buff = Buffer.from(string);
    return  buff.toString("hex")
  } 
  
  //转码
  function hexToObj(hex){
    var buff = Buffer.from(hex,"hex");
    var s = buff.toString("utf8");
    var obj = JSON.parse(s);
    return obj;
  }
module.exports = router;