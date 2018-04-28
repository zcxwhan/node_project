var express = require('express');
var router = express.Router();
var qs=require("querystring");
const mongo = require("mongodb").MongoClient;
const multer = require('multer');
var fs=require("fs");
/* GET home page. */
router.get('/',function(req, res, next){
//这里不用配置  默认读public中的index.html
});
router.get('/confirm', function(req, res, next) {
    var cookie=qs.parse(req.headers.cookie,"; ","=");
    if(cookie.WBID){
      confirmTocken(cookie.WBID)
      .then(success,errors);
    }else{
      res.send(JSON.stringify({tocken:false}));
    }
    function success(username){
      var data={
        username:username,
        tocken:true
      }
      res.send(JSON.stringify(data));
    }
    function errors(){
      res.send(JSON.stringify({tocken:false}));
    }
});
//tocken确认
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
          var coll = odb.collection("tockens").find({username:username}).toArray(function(err,result){
            if(result[0].tocken==tocken){
              succ(username);
              console.log("有效tocken");
            }else{
              console.log("无效tocken");
              failed("无效tocken");
            }
          });
      });
    });
  }
  //转码
  function hexToObj(hex){
    var buff = Buffer.from(hex,"hex");
    var s = buff.toString("utf8");
    var obj = JSON.parse(s);
    return obj;
  }

//list路由
router.get("/goods/list",(req,res)=>{
  let page = req.query.page;  
  page = page ? parseInt(page) : 0;
  let allPage;
  //链接数据库并返回数据;
  mongo.connect("mongodb://10.9.153.180:27017",(err,client)=>{
      let odb = client.db("wb");
      //设计分页逻辑 => skip | limit 来执行; skip 上的page值 => 前端发送的内容;
      odb.collection("list")
      .find({})
      .toArray((err,result)=>{
          allPage=Math.ceil(Number(result.length)/12);
      });

      odb.collection("list")
      .find({})
      .skip(page * 12)
      .limit(12)
      .toArray((err,result)=>{
          let oResult = Object.assign({},{
              allp:allPage,
              nowp:page+1,
              data:result
          });
          res.send(oResult);
      })
  });
});

//头像上传
//配置diskStorage来控制文件存储的位置以及文件名字等
var storage = multer.diskStorage({
  //确定图片存储的位置
  destination:  process.cwd() + '/public/uploads', //如果你传递的是一个函数，你负责创建文件夹，如果你传递的是一个字符串，multer会自动创建
  //确定图片存储时的名字,注意，如果使用原名，可能会造成再次上传同一张图片的时候的冲突
  filename: function (req, file, cb){
      //console.log(req.cookies);
      var username=hexToObj(req.cookies.WBID.split(".")[1]).name; //找到当前提交头像用户
      if(file.originalname.slice(-3,-1)=="jp"){//只要上传jpg的就命名为用户.jpg
        fs.exists(process.cwd()+"/public/uploads/"+username+".png", function(exists) {
          if(exists){
            fs.unlinkSync(process.cwd()+"/public/uploads/"+username+".png");  
          }
          cb(null, username+".jpg"); 
        });             //头像 只有一个----覆盖
      }else{//上传的是png
        fs.exists(process.cwd()+"/public/uploads/"+username+".jpg", function(exists) {
          if(exists){
            fs.unlinkSync(process.cwd()+"/public/uploads/"+username+".jpg");  
          }
          cb(null, username+".png"); 
        });
          
      }
      
  }
});
//生成的专门处理上传的一个工具，可以传入storage、limits等配置
var upload = multer({storage: storage});

//接收上传图片请求的接口
router.post('/upload', upload.single('file1'), function (req, res, next) {
  //图片已经被放入到服务器里,且req也已经被upload中间件给处理好了（加上了file等信息）
  //线上的也就是服务器中的图片的绝对地址
  var url = '/uploads/' + req.file.filename
  res.json({
      code : 200,
      data : url
  })
});

module.exports = router;
