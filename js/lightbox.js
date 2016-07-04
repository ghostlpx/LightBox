//;(function)前面的分号是防止多文件进行压缩时出现语法错误
;(function($){

	var LightBox = function ( opts ) {

		var self = this;

		this.opts = {
			maxWidth : $(window).width(),
			maxHeight : $(window).height(),
			speed : "slow"
		}

		$.extend( self.opts, opts||{} );

		//创建遮罩层和弹出框
		this.popupMask = $('<div id="G-lightbox-mask">');
		this.popupWin = $('<div id="G-lightbox-popup">');

		//保存body
		this.bodyNode = $(document.body);

		//渲染剩余的DOM节点，并插入到body中
		this.renderDOM();

		//一个完整对象的所有信息
		this.picViewArea = this.popupWin.find("div.lightbox-pic-view");//图片预览区域
		this.popupPic = this.popupWin.find("img.lightbox-image");//图片
		this.picCaptionArea = this.popupWin.find("div.lightbox-pic-caption");//图片描述区域
		this.nextBtn = this.popupWin.find("span.lightbox-next-btn");
		this.prevBtn = this.popupWin.find("span.lightbox-prev-btn");
		this.captionText = this.popupWin.find("p.lightbox-pic-desc");//图片描述文字
		this.currentIndex = this.popupWin.find("span.lightbox-of-index");//图片当前索引
		this.closeBtn = this.popupWin.find("span.lightbox-close-btn");//关闭按钮

		//事件委托，获取组数据
		this.groupName = null;
		this.groupData = [];	//放置同一组别的对象信息
		this.bodyNode.delegate(".js-lightbox,*[data-role=lightbox]","click",function(e){
			//阻止事件冒泡
			e.stopPropagation();

			var currentGroupName = $(this).attr("data-group");

			if ( self.groupName != currentGroupName ) {
				self.groupName = currentGroupName;

				//根据当前组名获取同一组数据
				self.getGroup();
			}

			//初始化弹出
			self.initPopup( $(this) );

		});

		//关闭弹窗
		this.popupMask.click(function(){
			$(this).fadeOut();
			self.popupWin.fadeOut();
			self.clear = false;
		});
		this.closeBtn.click(function(){
			self.popupMask.fadeOut();
			self.popupWin.fadeOut();
			self.clear = false;
		});

		//实现上下切换按钮功能
		this.flag = true;
		this.prevBtn.hover(function(){
			if ( !$(this).hasClass("disabled") && self.groupData.length != 1 ) {
				$(this).addClass("lightbox-prev-btn-show");
			}
		}, function(){
			$(this).removeClass("lightbox-prev-btn-show");
		}).click(function(e){
			if ( !$(this).hasClass("disabled") && self.flag ) {
				self.flag = false;
				e.stopPropagation();
				self.goto("prev");
			}
		});

		this.nextBtn.hover(function(){
			if ( !$(this).hasClass("disabled") && self.groupData.length != 1 ) {
				$(this).addClass("lightbox-next-btn-show");
			}
		}, function(){
			$(this).removeClass("lightbox-next-btn-show");
		}).click(function(e){
			if ( !$(this).hasClass("disabled") && self.flag ) {
				self.flag = false;
				e.stopPropagation();
				self.goto("next");
			}
		});

		//绑定窗口调整和键盘事件
		var timer = null;
		this.clear = false;
		$(window).resize(function(){
			if ( self.clear ) {
				window.clearTimeout(timer);
				timer = window.setTimeout(function(){
					self.loadPicSize( self.groupData[self.index].src );
				}, 500);
			}
		}).keyup(function(e){
			var keyValue = e.which;
			if ( self.clear ) {
				if ( keyValue == 37 || keyValue == 38 ) {
					self.prevBtn.click();
				} else if ( keyValue == 39 || keyValue == 40 ) {
					self.nextBtn.click();
				}
			}
		});

	};

	LightBox.prototype = {

		goto : function (dir) {
			if ( dir === "next" ) {
				this.index++;
				if ( this.index >= this.groupData.length-1 ) {
					this.nextBtn.addClass("disabled").removeClass("lightbox-next-btn-show");
				}
				if ( this.index != 0 ) {
					this.prevBtn.removeClass("disabled");
				} 

				var src = this.groupData[this.index].src;
				this.loadPicSize(src);

			} else if ( dir === "prev" ) {
				this.index--;
				if ( this.index <= 0 ) {
					this.prevBtn.addClass("disabled").removeClass("lightbox-prev-btn-show");
				}
				if ( this.index != this.groupData.length-1 ) {
					this.nextBtn.removeClass("disabled");
				}

				src = this.groupData[this.index].src;
				this.loadPicSize(src);
			}
		},

		loadPicSize : function (currentSource) {
			var self = this;

			//清除上一张图片的宽高设定
			this.popupPic.css({ "width":"auto", "height":"auto" }).hide();
			//隐藏上一张图片的描述区域
			this.picCaptionArea.hide();

			this.preLoadingImg (currentSource, function(){//图片加载完毕的回调函数
				
				//将当前点击的图片地址传给弹出框中的图片
				self.popupPic.attr( "src", currentSource );

				//拿到图片的宽和高以备使用
				var picWidth = self.popupPic.width(),
					picHeight = self.popupPic.height();

				//根据图片的宽和高进行改变，从开始的各占视口宽高的一半到图片的真实宽高
				self.changePic(picWidth, picHeight);
			});
		},

		changePic : function ( width, height ) {
			var self = this,
				winWidth = /*$(window).width()*/this.opts.maxWidth,
				winHeight = /*$(window).height()*/this.opts.maxHeight;

			var scale = Math.min(winWidth/(width+10), winHeight/(height+10), 1);
			width = width*scale;
			height = height*scale;

			this.picViewArea.animate({
				width : width-10,
				height : height-10
			}, self.opts.speed);

			//根据图片的宽和高进行动画，从开始的各占视口宽高的一半到图片的真实宽高
			this.popupWin.animate({
				width : width,
				height : height,
				marginLeft : -(width/2),
				top : ($(window).height()-height)/2
			}, self.opts.speed, function () {
				self.popupPic.css({
					width : width-10,
					height : height-10
				}).fadeIn();
				self.picCaptionArea.fadeIn();
				self.flag = true;
				self.clear = true;
			});

			//设置描述文字和当前索引
			this.captionText.text( this.groupData[this.index].caption );
			this.currentIndex.text( "当前索引：" + (this.index+1) + " of " + this.groupData.length );

		},

		//图片预加载判断
		preLoadingImg : function (src, callback) {
			var img = new Image();

			//兼容ie
			if (window.ActiveXObject) {
				img.onreadystatechange = function () {
					if (this.readyState === "complete") {
						callback();
					}
				}
			} else {
				img.onload = function () {
					callback();
				}
			}

			img.src = src;
		},

		showMaskAndPopup : function ( currentSource, currentId ) {
			//console.log(currentSource);
			var self = this;

			this.popupPic.hide();
			this.picCaptionArea.hide();

			this.popupMask.fadeIn();

			var winWidth = /*$(window).width()*/this.opts.maxWidth,
				winHeight = /*$(window).height()*/this.opts.maxHeight;

			//设置图片区域的宽高为可视区宽高的一半
			this.picViewArea.css({
				width : winWidth/2,
				height : winHeight/2
			});

			this.popupWin.fadeIn();

			var viewHeight = winHeight/2 + 10;
			this.popupWin.css({
				width : winWidth/2 + 10,
				height : viewHeight,
				marginLeft : -(winWidth/2 + 10)/2,
				top : -viewHeight
			}).animate({
				top : ($(window).height()-viewHeight)/2
			}, self.opts.speed, function(){
				//加载图片
				self.loadPicSize(currentSource);
			});


			//根据当前点击的元素id获取在当前组别里面的索引
			this.index = this.getIndexOf( currentId );

			var groupDataLength = this.groupData.length;
			if ( groupDataLength>1 ) {
				if (this.index === 0) {
					this.prevBtn.addClass("disabled");
					this.nextBtn.removeClass("disabled");
				} else if (this.index === groupDataLength-1) {
					this.prevBtn.removeClass("disabled");
					this.nextBtn.addClass("disabled");
				} else {
					this.prevBtn.removeClass("disabled");
					this.nextBtn.removeClass("disabled");
				}
			} else {
				this.prevBtn.addClass("disabled");
				this.nextBtn.addClass("disabled");
			}

		},

		getIndexOf : function (currentId) {
			var index = 0;
			$(this.groupData).each(function(i){
				index = i;
				if (this.id === currentId) {
					return false;	//跳出循环
				}
			});
			return index;
		},

		initPopup : function ( currentObj ) {
			var self = this,
				currentSource = currentObj.attr("data-source"),
				currentId = currentObj.attr("data-id");//获取到图片的id，得到其在组内的位置，用以判断是否显示左右切换按钮

			this.showMaskAndPopup( currentSource, currentId );
		},

		getGroup : function () {
			var self = this;

			//获取同一组对象
			var groupList = this.bodyNode.find("[data-group="+ this.groupName +"]");

			//初始化每个对象里的数据
			this.groupData.length = 0;
			groupList.each(function(){
				self.groupData.push({
					src : $(this).attr("data-source"),
					id : $(this).attr("data-id"),
					caption : $(this).attr("data-caption")
				});
			});

			//console.log(this.groupData);
		},

		renderDOM : function () {
			var strDOM = '<div class="lightbox-pic-view">'+
							'<span class="lightbox-btn lightbox-prev-btn"></span>'+
							'<img src="images/2-2.jpg" class="lightbox-image">'+
							'<span class="lightbox-btn lightbox-next-btn"></span>'+
						  '</div>'+
						  '<div class="lightbox-pic-caption">'+
							'<div class="lightbox-caption-area">'+
								'<p class="lightbox-pic-desc">图片标题</p>'+
								'<span class="lightbox-of-index">当前索引：1 of 4</span>'+
							'</div>'+
							'<span class="lightbox-close-btn"></span>'+
						  '</div>';

			this.popupWin.html(strDOM);
			this.bodyNode.append(this.popupMask, this.popupWin);
		}
	}

	//抛出接口
	window["LightBox"] = LightBox;

})(jQuery);