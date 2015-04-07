/*
 * 实现了一个不完整的js游戏引擎
 * 参考了cocos2d-js
 */
(function(){
	var miniengine = miniengine || {};
    //如果命名冲突，可以修改me
	window.me = miniengine


    /*
     * 所有类的基类，主要实现了extend方法
     * 注意扩展属性时没有使用深度复制
     */
	miniengine.Class = function(){
		//dummy class
	}

	initializing = false;
	miniengine.Class.extend = function(prop) {
		var _super = this.prototype;

		initializing = true;
		var prototype = new this();
		initializing = false;

		for(var key in prop) {
			console.log("add key:" + key);
			console.log(prop[key]);
			prototype[key] = typeof prop[key] === "function" && typeof _super[key] === "function" ?
				(function(key,fn) {
					return function() {
						var tmp = this._super;
						this._super = _super[key];
						// console.log("this._super:" + key);
						// console.log(this._super);
						var ret = fn.apply(this,arguments);
						this._super = tmp;
						return ret;
					}
				})(key,prop[key]) : prop[key];
			console.log(prototype[key]);
		}

		function MyClass() {
			if(!initializing && this.init) {
				this.init.apply(this,arguments);
			} }
		MyClass.prototype = prototype;
		MyClass.prototype.constructor = MyClass;
		MyClass.extend = arguments.callee;
		return MyClass;
	}

    /*
     * Game类
     * 程序的入口点为run函数
     */
	miniengine.Game = miniengine.Class.extend({
		node:null,
        //初始化，需要提供canvas元素的ID，大小
		init: function(elem,width,height) {
			if(document.body) {
				this.canvas = document.getElementById(elem);
				this.canvas.width = width;
				this.canvas.height = height;
				this.context = this.canvas.getContext("2d");
			}
		},
        //run方法的参数是一个node类型的变量，代表所有类的容器
		run: function(n) {
			this.node = n;
			var c = this.context;
            //requestAnimationFrame需要考虑兼容性的问题
            //TODO
			function step(timestamp) {
				n.render(c);
				window.requestAnimationFrame(step);
			}
			window.requestAnimationFrame(step);
		}
	});
    
    /*
     * Node类
     * 可以作为容器使用，也用于扩展更高级的精灵、label等
     */
	miniengine.Node = miniengine.Class.extend({
		children:null,
		top:0,
		left:0,
		width:0,
		height:0,

		init: function() {
			this.top = 0;
			this.left = 0;
			this.width = 0;
			this.height = 0;
			this.children = [];
		},

        //设置属性，主要设置元素的位置，大小等
		attr: function(prop) {
			for(key in prop) {
				this[key] = prop[key];
			}
		},

        //绘制自身及其所包含的其他Node
		render: function(context) {
			this._render(context);
			for(var i = 0; i < this.children.length; i++) {
				this.children[i].render(context);
			}
		},

        //Node本身不需要绘制
		_render: function(context) {
			;
		},

        //用于产生动画，在duration时间内将Node移动到newPoint，然后执行callback
		moveTo: function(duration,newPoint,callback) {
			var speedX = (newPoint.left - this.left) / duration;
			var speedY = (newPoint.top - this.top) / duration;
			var start = null;
			var that = this;
            //移动一次
			var moveStep = function(timestamp) {
				if(start === null) start = timestamp;
				var delta = timestamp - start;
				var deltaX = Math.floor(speedX * delta);
				var deltaY = Math.floor(speedY * delta);
				that.top = that.top + deltaY;
				that.left = that.left + deltaX;
				if( (speedX > 0 && that.left > newPoint.left) ||
					(speedX < 0 && that.left < newPoint.left) ||
					(speedY > 0 && that.top > newPoint.top) ||
					(speedY < 0 && that.top < newPoint.top)){
					that.left = newPoint.left;
					that.top = newPoint.top;
					callback();
				}else{
					window.requestAnimationFrame(moveStep);
				}
			};
			window.requestAnimationFrame(moveStep);
		},
        //增加子节点
		addChild: function(c) {
			this.children.push(c);
			c.parent = this;
		},
        //删除子节点
		removeFromParent: function() {
			for(var i = 0; i < this.parent.children.length; i++) {
				if(this.parent.children[i] === this) {
					this.parent.children.splice(i,1);
					break;
				}
			}
		},
        //删除子节点
		removeChild: function(c) {
			for(var i = 0; i < this.children.length; i++) {
				if(this.children[i] === c) {
					this.children.splice(i,1);
					break;
				}
			}
		}
	});

    /*
     * Sprite类
     */
    //resoure用于缓存图片资源
	miniengine.resource = {}
	miniengine.Sprite = miniengine.Node.extend({
		imgLoaded:false,
		img:null,
        //需要一张图片初始化
		init: function(image) {
			this._super();
			//console.log("Node init");

			if(image == undefined){
				this.img = null;
			}else{
                //如果已经加载过，不需要加载第二次
				if(miniengine.resource[image]) {
					this.img = miniengine.resource[image];
					this.imgLoaded = true;
					return;
				}
				this.img = new Image();
				miniengine.resource[image] = this.img;
                //图片加载后设置已加载标志
				this.img.onload = (function(that) {
					return function() {
						that.imgLoaded = true;
						console.log("image loaded");
					}
				})(this);
				this.img.src = image;
			}
		},
        //更改图片
		setImage: function(image) {
			console.log("set image: " + image)
			if(miniengine.resource[image]) {
				this.img = miniengine.resource[image];
				this.imgLoaded = true;
				return;
			}
			this.img = new Image();
			miniengine.resource[image] = this.img;
			this.img.onload = (function(that) {
				return function() {
					that.imgLoaded = true;
					console.log("image loaded");
				}
			})(this);
			this.img.src = image;
		},
        //绘制自身的函数，主要是drawimage
        //需要考虑图片未加载完成的问题
		_render: function(context) {
			if(this.img != null){
				if(this.imgLoaded == false) {
					setTimeout((function(that) {
						return function() {
							that._render(context);
						}
					})(this),500);
					console.log("image still loading...");
					return;
				}
				else
					context.drawImage(this.img,this.left,this.top,this.width,this.height);
			}

		},
	});

    /*
     * Label类，显示文字
     */
	miniengine.Label = miniengine.Node.extend({
		text: null,
		font: null,
		color: null,
		align: null,

        //初始化
        //如果需要修改，使用父类的attr函数
		init: function(t) {
			this._super();
			this.text = "";
			this.font = "";
			this.color = "#000000";
			this.align = "center"
			this.setText(t);
		},
        //修改文本
		setText: function(t) {
			this.text =t;
		},
        //绘制自身，主要是调用fillText
		_render: function(context) {
			context.save();
			context.font = this.font
			context.fillStyle = this.color;
			context.textAlign = this.align;
			context.fillText(this.text,this.left,this.top);
			context.restore();
		}
	});

})();
