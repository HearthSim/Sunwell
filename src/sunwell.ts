import Card from "./Card";

var PLATFORM_NODE = (typeof window == "undefined");
if (PLATFORM_NODE) {
	Promise = require("promise");
	var Canvas = require("canvas");
	Image = Canvas.Image;
}


var WebPlatform = function() {
	this.buffers = [];
}

WebPlatform.prototype.getBuffer = function(width: number, height: number, clear: boolean) {
	var cvs;

	if (this.buffers.length) {
		if (width) {
			for (var i = 0; i < this.buffers.length; i++) {
				if (this.buffers[i].width === width && this.buffers[i].height === height) {
					cvs = this.buffers.splice(i, 1)[0];
					break;
				}
			}
		} else {
			cvs = this.buffers.pop();
		}
		if (cvs) {
			if (clear) {
				cvs.getContext("2d").clearRect(0, 0, cvs.width, cvs.height);
			}
			return cvs;
		}
	}

	cvs = document.createElement("canvas");

	if (width) {
		cvs.width = width;
		cvs.height = height;
	}

	return cvs;
}

WebPlatform.prototype.freeBuffer = function(buffer) {
	this.buffers.push(buffer);
}

WebPlatform.prototype.loadAsset = function(img, url, loaded, error) {
	img.addEventListener("load", loaded);
	img.addEventListener("error", error);

	img.src = url;
}


export default class Sunwell {
	public options;
	public assets;
	public bodyFontSizeExtra;
	public races;
	public canvas;
	public target;

	private activeRenders;
	private assetListeners;
	private renderQuery;
	private renderCache;

	constructor(options) {
		options.titleFont = options.titleFont || "Belwe";
		options.bodyFont = options.bodyFont || "Franklin Gothic";
		options.bodyFontSize = options.bodyFontSize || 60;
		options.bodyFontOffset = options.bodyFontOffset || {x: 0, y: 0};
		options.bodyLineHeight = options.bodyLineHeight || 50;
		options.assetFolder = options.assetFolder || "/assets/";
		options.platform = options.platform || new WebPlatform();
		options.drawTimeout = options.drawTimeout || 5000;
		options.cacheSkeleton = options.cacheSkeleton || false;
		options.maxActiveRenders = options.maxActiveRenders || 12;
		options.debug = options.debug || false;

		this.options = options;
		this.assets = {};
		this.assetListeners = {};
		this.renderQuery = [];
		this.activeRenders = 0;
		this.renderCache = {};
		this.bodyFontSizeExtra = "";

		if (!PLATFORM_NODE) {
			// we run in node-canvas and we dont support ctx.font="16px/1em" notation
			this.bodyFontSizeExtra = "/1em";
		}
	}

	public log(...args: any[]): void {
		if (this.options.debug) {
			console.log.apply("[INFO]", arguments);
		}
	}

	public error(...args: any[]): void {
		console.log.apply("[ERROR]", arguments);
	}

	public fetchAsset(path: string): Promise<any> {
		var assets = this.assets;
		var assetListeners = this.assetListeners;
		var _this = this;

		return new Promise((resolve) => {
			if (assets[path] === undefined) {
				assets[path] = new Image();
				assets[path].crossOrigin = "Anonymous";
				assets[path].loaded = false;

				_this.log("Requesting", path);
				_this.options.platform.loadAsset(assets[path], path, function() {
					assets[path].loaded = true;
					resolve();
					if (assetListeners[path]) {
						for (var a in assetListeners[path]) {
							assetListeners[path][a](assets[path]);
						}
						delete assetListeners[path]
					}
				}, function() {
					_this.error("Error loading asset:", path);
					// An asset load error should not reject the promise
					resolve();
				});
			} else if (!assets[path].loaded) {
				assetListeners[path] = assetListeners[path] || [];
				assetListeners[path].push(resolve);
			} else {
				resolve();
			}
		});
	}

	public prepareRenderingCard(card: Card): void {
		this.log("Queried render:", card.name);
		this.renderQuery.push(card);
		if (!this.activeRenders) {
			this.renderTick();
		}
	}

	public getBuffer(width: number, height: number, clear?: boolean) {
		return this.options.platform.getBuffer(width, height, clear);
	}

	public freeBuffer(buffer) {
		return this.options.platform.freeBuffer(buffer);
	}

	public render(): void {
		if (this.activeRenders > this.options.maxActiveRenders) {
			return;
		}

		if (!this.renderQuery.length) {
			return;
		}

		let card: Card = this.renderQuery.shift();
		this.activeRenders++;

		var cvs = card.canvas;
		var ctx = cvs.getContext("2d");
		var s = card.width / 764;

		this.log("Preparing assets for", card.name);

		card.sunwell = card.sunwell || {};

		var assetsToLoad = card.getAssetsToLoad();

		var texturesToLoad = [];

		if (card.texture && typeof card.texture === "string") {
			texturesToLoad.push(card.texture);
		}

		for (var i in assetsToLoad) {
			var path = this.getAssetPath(assetsToLoad[i]);
			if (!this.assets[path]) texturesToLoad.push(path);
		}

		this.log("Preparing to load assets");
		var fetches = [];
		for (var i in texturesToLoad) {
			fetches.push(this.fetchAsset(texturesToLoad[i]));
		}

		Promise.all(fetches).then(() => {
			card.draw(ctx, s);
		}).catch((e) => { this.error("Error while drawing card:", e) });
	};

	public getAssetPath(key: string): string {
		return this.options.assetFolder + key + ".png";
	}

	public getAsset(key: string) {
		var asset = this.assets[this.getAssetPath(key)];
		if (!asset) {
			this.error("Missing asset", key);
			return
		}
		if (!asset.loaded) {
			this.error("Attempting to getAsset not loaded", asset);
			return;
		}
		return asset;
	}

	public renderTick(): void {
		this.render();
		let callback = this.renderTick.bind(this);

		if (PLATFORM_NODE) {
			setTimeout(callback, 16);
		} else {
			window.requestAnimationFrame(callback);
		}
	}

	public createCard(props, width: number, renderTarget): Card {
		return new Card(this, props, width, renderTarget);
	}
}

module.exports = Sunwell;
