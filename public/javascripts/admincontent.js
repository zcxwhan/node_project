$(function(){
//点击active样式切换
$("#main-menu a").on("click",function(){
    $("#main-menu a").removeClass("active-menu");
    $(this).addClass("active-menu");
    $("#welcome").html($(this).html());
    $("#page-inner").html('');
    return false;
});

//没有查询到的渲染
function render_h3(){
    var $h3=$("<h3></h3>");
    $h3.addClass("h3top");
    $h3div=$("<div></div>");
    $h3div.html('<select name="" id="select"><option value="编号">编号</option><option value="价格大于">价格大于</option><option value="价格小于">价格小于</option></select>'+'<input type="text" placeholder="search" id="searchInp"><button id="search">Search</button>');
    $h3i=$("<i id='add'>+</i>");
    $h3.append($h3div);
    $h3.append($h3i);
    $("#page-inner").append($h3).append("<h4>没有查询到啊！！！！</h4>");
}
//公共函数 渲染页面
function render_page(res){
    var $h3=$("<h3></h3>");
    $h3.addClass("h3top");
    $h3div=$("<div></div>");
    $h3div.html('<select name="" id="select"><option value="编号">编号</option><option value="价格大于">价格大于</option><option value="价格小于">价格小于</option></select>'+'<input type="text" placeholder="search" id="searchInp"><button id="search">Search</button>');
    $h3i=$("<i id='add'>+</i>");
    $h3.append($h3div);
    $h3.append($h3i);
    $table=$("<table class='table table-hover table-striped'></table>");
    $thead=$("<thead></thead>");
    $thead.html('<tr class="info"><th>编号</th><th>图片</th><th>名称描述</th><th>价格</th><th>销量</th><th>评价量</th><th>操作</th></tr>');
    $tbody=$("<tbody></tbody>");
    $.each(res.data,function(index,val){
        $tr=$("<tr></tr>");
        $tr.html('<td id="hao">'+val.id+'</td>'+'<td id="srcs"><img src='+ val.src+' alt=""></td>'
        +'<td id="des">'+val.des+'</td>'+'<td id="price">'+ val.price+'</td>'+'<td id="sail">'+val.sailnum+'</td>'+
    '<td id="comment">'+val.comment+'</td>'+'<td><span class="update">修改</span>&nbsp;<em class="del">删除</em></td>'); 
    $tbody.append($tr);
    });
    $table.append($thead).append( $tbody);
    $("#page-inner").append($h3).append($table); 
}

//商品列表
$('#goodslist').on("click",goodslist);
function goodslist(){
    $("#page-inner").html('');
    var options={
        type:"get",
        url:"/goods/admin/admin/goodslist"
    }
   $.ajax(options).then(function(res){
        render_page(res);
   }).then(function(){
        new Add($('#add'));
        new Update();
        new Del();
        new Select();
   });
}


//查询 select
function Select(){
    this.init();
}
Select.prototype={
    constructor:Select,
    init:function(){
       $("#search").on("click",this.add_evt.bind(this));
    },
    add_evt:function(){
       if($("#searchInp").val().trim()==""){
           alert("请输入啊。。");
       }else{
           if($("#select").val()=="编号"){
                this.mongo_bianhao();
           }else if($("#select").val()=="价格大于"){
                this.mongo_pricegt();
           }else if($("#select").val()=="价格小于"){
                this.mongo_pricelt();
           }
       }
    },
    mongo_bianhao:function(){ //按编号查询
        var options={
            url:"/goods/admin/admin/select",
            data:{
                type:"bianhao",
                val:$("#searchInp").val()
            }
        }
        $.ajax(options).then(function(res){
            if(res==0){
                alert("数据库错误了！");
            }else if(res==1){
                $("#page-inner").html('');
                render_h3();
            }else{
                $("#page-inner").html('');
                render_page(res);
            }  
        }).then(function(){
            new Add($('#add'));
            new Update();
            new Del();
            new Select();
       });
    },
    mongo_pricegt:function(){ //按价格大于查询
        var options={
            url:"/goods/admin/admin/select",
            data:{
                type:"pricegt",
                val:$("#searchInp").val()
            }
        }
        $.ajax(options).then(function(res){
            if(res==0){
                alert("数据库错误了！");
            }else if(res==1){
                $("#page-inner").html('');
                render_h3();
            }else{
                $("#page-inner").html('');
                render_page(res);
            }  
        }).then(function(){
            new Add($('#add'));
            new Update();
            new Del();
            new Select();
       });
    },
    mongo_pricelt:function(){ //按价格小于查询
        var options={
            url:"/goods/admin/admin/select",
            data:{
                type:"pricelt",
                val:$("#searchInp").val()
            }
        }
        $.ajax(options).then(function(res){
            if(res==0){
                alert("数据库错误了！");
            }else if(res==1){
                $("#page-inner").html('');
                render_h3();
            }else{
                $("#page-inner").html('');
                render_page(res);
            }  
        }).then(function(){
            new Add($('#add'));
            new Update();
            new Del();
            new Select();
       });
    }
   
}


    //增
    function Add(elem){
        this.init(elem);
    }
    Add.prototype={
        constructor:Add,
        init:function(elem){
            this.elem=elem;
            this.elem.on("click",this.load_data.bind(this));
        },
        load_data:function(){
            var _this=this;
            $.msg({
                type:3,
                mask:true,
                id:"add-box",
                width:600,
                height:600,
                title:"数据增加",
                content:_this.addData(),
                callback:_this.addmongo
            });
        },
        addData:function(){  //页面上input
            var $div=$("<div></div>");
            for(var i=0;i<6;i++){
                var $input=$("<input>");
                $input.addClass("ninput");
                switch(i){
                    case 0:
                    $input.attr("placeholder","输入商品编号");
                    break;
                    case 1:
                    $input.attr("placeholder","图片地址");
                    $input.val("https://image8.wbiao.co/shop/e0023f102d704edd939c23b516248195.jpg?x-oss-process=image/resize,m_pad,h_275");
                    break;
                    case 2:
                    $input.attr("placeholder","具体描述");
                    break;
                    case 3:
                    $input.attr("placeholder","价格");
                    break;
                    case 4:
                    $input.attr("placeholder","销量");
                    break;
                    case 5:
                    $input.attr("placeholder","评价量");
                    break;
                }
                $div.append($input);
            }
            return $div;
        },
        addmongo:function(){ //ajax请求添加
            var datas={};
            datas.id=$(".ninput").eq(0).val();
            datas.src=$(".ninput").eq(1).val();
            datas.des=$(".ninput").eq(2).val();
            datas.price=$(".ninput").eq(3).val();
            datas.sailnum=$(".ninput").eq(4).val();
            datas.comment=$(".ninput").eq(5).val();
            var options={
                type:"post",
                url:"/goods/admin/admin/add",
                data:datas
            }
           $.ajax(options).then(function(res){
                if(res==0){
                    alert("数据库错误了");
                    $(".mask").fadeOut().remove();
                    $(".win").fadeOut().remove();
                }else if(res==1){
                    alert("id存在 请重新输入");
                }else{
                    //加入页面
                    alert("添加成功");
                    $(".mask").fadeOut().remove();
                    $(".win").fadeOut().remove();
                    goodslist();
                }
           });

        }
    }
  


//更新update
    function Update(){
        this.init();
    }
    Update.prototype={
        constructor:Update,
        init:function(){
           $(".update").on("click",this.add_evt.bind(this));
        },
        add_evt:function(e){
           // alert($(e.target).parent().siblings("#price").html());
            var _this=this;
            $.msg({
                type:3,
                mask:true,
                id:"update-box",
                width:600,
                height:600,
                title:"数据更改",
                content:_this.upData($(e.target).parent()),
                callback:_this.upmongo
            });
        },
        upData:function(elem){  //页面上input
            var $div=$("<div></div>");
            for(var i=0;i<6;i++){
                var $input=$("<input>");
                $input.addClass("ninput");
                switch(i){
                    case 0:
                        $input.val(elem.siblings("#hao").html());
                        $input.attr("disabled","disabled");
                        break;
                    case 1:
                        $input.val(elem.siblings("#srcs").find("img").attr("src"));
                        break;
                    case 2:
                        $input.val(elem.siblings("#des").html());
                        break;
                    case 3:
                        $input.val(elem.siblings("#price").html());
                        break;
                    case 4:
                        $input.val(elem.siblings("#sail").html());
                        break;
                    case 5:
                        $input.val(elem.siblings("#comment").html());
                        break;
                }
                $div.append($input);
            }
            return $div;
        },
        upmongo:function(){ //ajax请求更新
            var datas={};
            datas.id=$(".ninput").eq(0).val();
            datas.src=$(".ninput").eq(1).val();
            datas.des=$(".ninput").eq(2).val();
            datas.price=$(".ninput").eq(3).val();
            datas.sailnum=$(".ninput").eq(4).val();
            datas.comment=$(".ninput").eq(5).val();
            var options={
                type:"post",
                url:"/goods/admin/admin/update",
                data:datas
            }
           $.ajax(options).then(function(res){
                if(res==0){
                    alert("数据库错误了");
                    $(".mask").fadeOut().remove();
                    $(".win").fadeOut().remove();
                }else{
                    alert("更新成功");
                    $(".mask").fadeOut().remove();
                    $(".win").fadeOut().remove();
                    goodslist();
                }
           });

        }
    }
    

//删除
function Del(){
    this.init();
}
Del.prototype={
    constructor:Del,
    init:function(){
       $(".del").on("click",this.add_evt.bind(this));
    },
    add_evt:function(e){
       // alert($(e.target).parent().siblings("#price").html());
        var _this=this;
        $.msg({
            type:3,
            mask:true,
            id:"del-box",
            width:600,
            height:200,
            title:"数据删除",
            content:_this.delData($(e.target).parent()),
            callback:_this.delmongo
        });
    },
    delData:function(elem){  //页面内容
        var $div=$("<div id='sure'></div>");
        $div.attr("iding",elem.siblings("#hao").html());
        $div.html("你确定删除？？？");
        return $div;
    },
    delmongo:function(){
        var options={
            type:"get",
            url:"/goods/admin/admin/del",
            data:{
                id:$("#sure").attr("iding")
            }
        }
       $.ajax(options).then(function(res){
            if(res==0){
                alert("数据库错误了");
                $(".mask").fadeOut().remove();
                $(".win").fadeOut().remove();
            }else{
                alert("删除成功");
                $(".mask").fadeOut().remove();
                $(".win").fadeOut().remove();
                goodslist();
            }
       });
    }
}

//用户列表
$('#userlist').on("click",userlist);
function userlist(){
    var options={
        type:"get",
        url:"/goods/admin/admin/userlist"
    }
   $.ajax(options).then(function(res){
       $.each(res.data,function(ind,val){
            var $h3=$("<h3></h3>");
            $h3.html("用户名  ："+val.username);
            $("#page-inner").append($h3);
       });
   });
}






});