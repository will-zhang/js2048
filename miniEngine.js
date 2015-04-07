(function(){
	var miniengine = miniengine || {};
	window.me = miniengine

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
			}
		}
		MyClass.prototype = prototype;
		MyClass.prototype.constructor = MyClass;
		MyClass.extend = arguments.callee;
		return MyClass;
	}

	miniengine.Game = miniengine.Class.extend({
		node:null,
		init: function(elem,width,height) {
			if(document.body) {
				this.canvas = document.getElementById(elem);
				this.canvas.width = width;
				this.canvas.height = height;
				this.context = this.canvas.getContext("2d");
			}
		},
		run: function(n) {
			this.node = n;
			var c = this.context;
			function step(timestamp) {
				n.render(c);
				window.requestAnimationFrame(step);
			}
			window.requestAnimationFrame(step);
		}
	});
	miniengine.resource = {}

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
		attr: function(prop) {
			for(key in prop) {
				this[key] = prop[key];
			}
		},
		render: function(context) {
			this._render(context);
			for(var i = 0; i < this.children.length; i++) {
				this.children[i].render(context);
			}
		},
		_render: function(context) {
			;
		},
		moveTo: function(duration,newPoint,callback) {
			var speedX = (newPoint.left - this.left) / duration;
			var speedY = (newPoint.top - this.top) / duration;
			var start = null;
			var that = this;
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
		addChild: function(c) {
			this.children.push(c);
			c.parent = this;
		},
		removeFromParent: function() {
			for(var i = 0; i < this.parent.children.length; i++) {
				if(this.parent.children[i] === this) {
					this.parent.children.splice(i,1);
					break;
				}
			}
		},
		removeChild: function(c) {
			for(var i = 0; i < this.children.length; i++) {
				if(this.children[i] === c) {
					this.children.splice(i,1);
					break;
				}
			}
		}
	});

	miniengine.Sprite = miniengine.Node.extend({
		imgLoaded:false,
		img:null,

		init: function(image) {
			this._super();
			//console.log("Node init");

			if(image == undefined){
				this.img = null;
			}else{
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
			}
		},
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

	miniengine.Label = miniengine.Node.extend({
		text: null,
		font: null,
		color: null,
		align: null,

		init: function(t) {
			this._super();
			this.text = "";
			this.font = "";
			this.color = "#000000";
			this.align = "center"
			this.setText(t);
		},
		setText: function(t) {
			this.text =t;
		},
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
