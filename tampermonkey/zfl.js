// ==UserScript==
// @name         宅福利自动加载下一页,放大,左右键快速滚动
// @description  宅福利自动加载下一页,放大,左右键快速滚动.更多功能欢迎提交issues
// @namespace    https://github.com/LiHang941/srcript/
// @version      0.59
// @description  try to take over the world!
// @author       etim@foxmail.com
// @include      *http*://*96**.net*
// @supportURL   https://github.com/xyetim/srcript
// @require      https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @grant        none
// ==/UserScript==
(function() {
    /*if(!/https:\/\/96**.net\/.+\/\d+\.html(.*?)/.test(window.location.href)){
        return;
    }*/
    $(function() {

        var ddpowerzoomer = {
            dsetting: {
                defaultpower: 2,
                powerrange: [2, 2],
                magnifiersize: [500, 500]
            },
            mousewheelevt: (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll": "mousewheel",
            //FF doesn't recognize mousewheel as of FF3.x
            $magnifier: {
                outer: null,
                inner: null,
                image: null
            },
            activeimage: null,

            movemagnifier: function(e, moveBol, zoomdir) {
                console.log("movemagnifier");
                var activeimage = ddpowerzoomer.activeimage; //get image mouse is currently over
                var activeimginfo = activeimage.info;
                var coords = activeimginfo.coords; //get offset coordinates of image relative to upper left corner of page
                var $magnifier = ddpowerzoomer.$magnifier;
                var magdimensions = activeimginfo.magdimensions; //get dimensions of magnifier
                var power = activeimginfo.power.current;
                var powerrange = activeimginfo.power.range;
                var x = e.pageX - coords.left; //get x coords of mouse within image (where top corner of image is 0)
                var y = e.pageY - coords.top;
                if (moveBol == true) {
                    if (e.pageX >= coords.left && e.pageX <= coords.right && e.pageY >= coords.top && e.pageY <= coords.bottom) //if mouse is within currently within boundaries of active base image
                    $magnifier.outer.css({
                        left: e.pageX - magdimensions[0] / 2,
                        top: e.pageY - magdimensions[1] / 2
                    }); //move magnifier so it follows the cursor
                    else { //if mouse is outside base image
                        ddpowerzoomer.activeimage = null,
                        $magnifier.outer.hide() //hide magnifier
                    }
                } else if (zoomdir) { //if zoom in
                    var od = activeimginfo.dimensions; //get dimensions of image
                    var newpower = (zoomdir == "in") ? Math.min(power + 1, powerrange[1]) : Math.max(power - 1, powerrange[0]) //get new power from zooming in or out
                    var nd = [od[0] * newpower, od[1] * newpower] //calculate dimensions of new enlarged image within magnifier
                    $magnifier.image.css({
                        width: nd[0],
                        height: nd[1]
                    });
                    activeimginfo.power.current = newpower; //set current power to new power after magnification
                }
                power = activeimginfo.power.current; //get current power
                var newx = -x * power + magdimensions[0] / 2; //calculate x coord to move enlarged image
                var newy = -y * power + magdimensions[1] / 2;
                $magnifier.inner.css({
                    left: newx,
                    top: newy
                }); //move image wrapper within magnifier so the correct image area is shown
            },

            setupimage: function($, imgref, options) {
                console.log("setupimage");
                var s = jQuery.extend({},
                ddpowerzoomer.dsetting, options);
                var $imgref = $(imgref);
                imgref.info = { //create object to remember various info regarding image
                    power: {
                        current: s.defaultpower,
                        range: s.powerrange
                    },
                    magdimensions: s.magnifiersize,
                    dimensions: [$imgref.width(), $imgref.height()],
                    coords: null
                }
                $imgref.unbind('mouseenter').mouseenter(function(e) { //mouseenter event over base image
                    var $magnifier = ddpowerzoomer.$magnifier;
                    $magnifier.outer.css({
                        width: s.magnifiersize[0],
                        height: s.magnifiersize[1]
                    }); //set magnifier's size
                    var offset = $imgref.offset(); //get image offset from document
                    var power = imgref.info.power.current;
                    $magnifier.inner.html('<img src="' + $imgref.attr('src') + '"/>') //get base image's src and create new image inside magnifier based on it
                    $magnifier.image = $magnifier.outer.find('img:first').css({
                        width: imgref.info.dimensions[0] * power,
                        height: imgref.info.dimensions[1] * power
                    }); //set size of enlarged image
                    var coords = {
                        left: offset.left,
                        top: offset.top,
                        right: offset.left + imgref.info.dimensions[0],
                        bottom: offset.top + imgref.info.dimensions[1]
                    }
                    imgref.info.coords = coords; //remember left, right, and bottom right coordinates of image relative to doc
                    $magnifier.outer.show();
                    ddpowerzoomer.activeimage = imgref;
                })
            },

            init: function($) {
                console.log("init");
                var $magnifier = $('<div style="position:absolute;width:100px;height:100px;display:none;overflow:hidden;border:1px solid black;" />').append('<div style="position:relative;left:0;top:0;" />').appendTo(document.body) //create magnifier container and add to doc
                ddpowerzoomer.$magnifier = {
                    outer: $magnifier,
                    inner: $magnifier.find('div:eq(0)'),
                    image: null
                }; //reference and remember various parts of magnifier
                $magnifier = ddpowerzoomer.$magnifier;
                $(document).unbind('mousemove.trackmagnifier').bind('mousemove.trackmagnifier',
                function(e) { //bind mousemove event to doc
                    if (ddpowerzoomer.activeimage) { //if mouse is currently over a magnifying image
                        ddpowerzoomer.movemagnifier(e, true) //move magnifier
                    }
                });

            }
        }; //ddpowerzoomer
        jQuery.fn.addpowerzoom = function(options) {
            var $ = jQuery;
            return this.each(function() { //return jQuery obj
                if (this.tagName != "IMG") return true //skip to next matched element
                var $imgref = $(this);
                if (this.offsetWidth > 0 && this.offsetHeight > 0) //if image has explicit CSS width/height defined
                ddpowerzoomer.setupimage($, this, options)
                else if (this.complete) { //account for IE not firing image.onload
                    ddpowerzoomer.setupimage($, this, options)
                } else {
                    $imgref.bind('load',
                    function() {
                        ddpowerzoomer.setupimage($, this, options)
                    })
                }
            })
        };

        //ddpowerzoomer.init($);
        //图片放大镜初始化
        $(".pagination-multi li a").each(function() {
            if ($(this).html() == "下一页") {
                next($(this).attr('href'));
            }
        });
        //$(".article-content").find('img').addpowerzoom({magnifiersize:[500,500],powerrange:[3,3]});
        $(window).keydown(function(event) {
            var y = window.screen.availHeight;
            if (event.keyCode === 37) { //keyCode37  =Left Arrow  | ←左箭头
                y = $(window).scrollTop() - y;
            } else if (event.keyCode === 39) { //keyCode39  =Right Arrow | →右箭头 
                y = $(window).scrollTop() + y;
            } else {
                return;
            }
            $("html,body").scrollTop(y);
        });
        $(document).scroll(function() {
            var top = $(document).scrollTop();
            if (top > 10) {
                //$('.header').fadeOut(100);
                $('.header').fadeOut(10);
            } else {
                //$('.header').fadeIn(100);
                $('.header').fadeIn(10);
            }
        });
        $(document).mousemove(function(e) {
            var top = e.originalEvent.y || e.originalEvent.layerY || 0;
            if (top > 10) {
                //$('.header').fadeOut(100);
                $('.header').fadeOut(10);
            } else {
                //$('.header').fadeIn(100);
                $('.header').fadeIn(10);
            }
        });

        //移除广告块
        var clearAd = {
            clear: function() {

                //此处添加广告框ID名,id|"#"
                var ad_id_name = ["AD_L1EVER", "commentyxpjw", "CommentText"];

                //此处添加广告框CLASS名,class|"."
                var ad_class_name = ["ads.ads-content.ads-post", "article-tags", "article-nav", "footer", "postsubmit", "pagination.pagination-multi", "title", "sidebar"];

                //此处添加广告框TAG名,tag|"<>"
                var ad_tag_name = ["blockquote"];

                for (var i = 0; i < ad_id_name.length; i++) {
                    //$('#' + ad_id_name[i]).hide();
                    $('#' + ad_id_name[i]).remove();
                };

                for (var i = 0; i < ad_class_name.length; i++) {
                    //$('.' + ad_class_name[i]).hide();
                    $('.' + ad_class_name[i]).remove();
                };

                for (var i = 0; i < ad_tag_name.length; i++) {
                    //$(ad_tag_name[i]).hide();
                    $(ad_tag_name[i]).remove();
                }

            },

            //简单的智能算法，屏蔽关联元素
            findSomeAdPossible: function() {
                var sap = $('div iframe'),
                ad_img = $('div script').parent().find('img,embed'),
                float_img = $('div object').parent().find('img,embed');

                this.arrayDel(sap, 360, 200);
                this.arrayDel(ad_img, 350, 150);
                this.arrayDel(float_img, 350, 150);
            },
            arrayDel: function(arr, conWidth, conHeight) {
                var len = arr.length;

                for (var i = 0; i < len; i++) {
                    var self = arr.eq(i);

                    if (self.width() <= conWidth || self.height() <= conHeight) {
                        self.hide();
                        //self.remove();
                    }

                }
            },
            fixcss: function() {

                //此处添加内容框ID名,id|"#"
                var con_id_name = [];

                //此处添加内容框CLASS名,class|"."
                var con_class_name = ["content"];

                //此处添加内容框TAG名,tag|"<>"
                var con_tag_name = ["img"];

                for (var i = 0; i < con_id_name.length; i++) {
                    $('#' + con_id_name[i]).css({

});
                };

                for (var i = 0; i < con_class_name.length; i++) {
                    $('.' + con_class_name[i]).css({
                        margin: '0 auto',
                    });
                };

                for (var i = 0; i < con_tag_name.length; i++) {
                    $(con_tag_name[i]).css({
                        height: 'auto',
                    });
                }
            },
            initad: function() {
                this.clear();
                this.fixcss();

                //简单的智能算法，关联元素是否屏蔽
                //this.findSomeAdPossible();
            }
        };

        clearAd.initad();

    });

    function next(url) {
        console.log("下一页网址:", url);
        $.get(url,
        function(res) {
            var nextReg = /<li class='next-page'><a href='(.+)'>(.+)<\/a><\/li>/g;
            //var reg = /<img.+src="(.+)"\s+\/>\s*<\/p>/g;
            //var reg = /<img.*src="(.+)"*>.*<\/p>/g;
            var reg = /<img.*[^>]*src=['"]([^'"]+)[^>]*>.*<\/p>/gi;
            var match = reg.exec(res);
            while (match != null) {
                console.log("图片地址:", match[1]);
                $(".article-content p").last().after('<p><img style="width:100%,height:auto;margin:0px auto;" src="' + match[1] + '"></p>');
                //$(".article-content").find('img').last().addpowerzoom({magnifiersize:[500,500],powerrange:[3,3]});
                //console.log(match[2]);
                match = reg.exec(res);
            }

            match = nextReg.exec(res);
            if (match != null) {
                next(match[1]);
            }
        },
        "text");
    }
})();
