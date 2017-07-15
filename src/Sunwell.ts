/*#if _PLATFORM == "node"
import Platform from "./platforms/NodePlatform.ts";
//#else */
import Platform from "./platforms/WebPlatform";
//#endif

import Card from "./Card";

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
	private isRendering;

	constructor(options) {
		options.titleFont = options.titleFont || "Belwe";
		options.bodyFont = options.bodyFont || "Franklin Gothic";
		options.aspectRatio = options.aspectRatio || 1.4397905759;
		options.bodyFontSize = options.bodyFontSize || 60;
		options.bodyFontOffset = options.bodyFontOffset || { x: 0, y: 0 };
		options.bodyLineHeight = options.bodyLineHeight || 50;
		options.assetFolder = options.assetFolder || "/assets/";
		options.platform = options.platform || new Platform();
		options.drawTimeout = options.drawTimeout || 5000;
		options.cacheSkeleton = options.cacheSkeleton || false;
		options.preloadedAssets = options.preloadedAssets || [];
		options.debug = options.debug || false;

		this.options = options;
		this.assets = {};
		this.assetListeners = {};
		this.renderQuery = {};
		this.activeRenders = 0;
		this.renderCache = {};
		this.bodyFontSizeExtra = this.options.platform.bodyFontSizeExtra;
		this.isRendering = false;
	}

	public log(...args: any[]): void {
		if (this.options.debug) {
			console.log.apply("[INFO]", arguments);
		}
	}

	public error(...args: any[]): void {
		console.log.apply("[ERROR]", arguments);
	}

	public fetchAsset(path: string) {
		var assets = this.assets;
		var assetListeners = this.assetListeners;
		var _this = this;

		return new this.options.platform.Promise((resolve) => {
			if (assets[path] === undefined) {
				assets[path] = new _this.options.platform.Image();
				assets[path].crossOrigin = "Anonymous";
				assets[path].loaded = false;

				_this.log("Requesting", path);
				_this.options.platform.loadAsset(assets[path], path, function () {
					assets[path].loaded = true;
					if (assetListeners[path]) {
						for (var a in assetListeners[path]) {
							assetListeners[path][a](assets[path]);
						}
						delete assetListeners[path];
					}
					resolve();
				}, function () {
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
		if (this.renderQuery[card.key]) {
			this.log("Skipping", card.key, "(already queued)");
		}
		this.renderQuery[card.key] = card;
		if (!this.isRendering) {
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
		let keys = Object.keys(this.renderQuery);
		if (!keys.length) {
			return;
		}

		let first = keys[0];
		let card: Card = this.renderQuery[first];
		delete this.renderQuery[first];

		var cvs = card.canvas;
		var ctx = cvs.getContext("2d");
		var s = card.width / 764;

		this.log("Preparing assets for", card.name);

		card.sunwell = card.sunwell || {};

		let assetsToLoad = card.getAssetsToLoad();
		var texturesToLoad: Array<string> = [];

		if (card.texture && typeof card.texture === "string") {
			texturesToLoad.push(card.texture);
		}

		for (let i in assetsToLoad) {
			let path = this.getAssetPath(assetsToLoad[i]);
			if (!this.assets[path] || !this.assets[path].loaded) texturesToLoad.push(path);
		}

		this.log("Preparing to load assets");
		let fetches: Array<Function> = [];
		for (let i in texturesToLoad) {
			fetches.push(this.fetchAsset(texturesToLoad[i]));
		}

		this.options.platform.Promise.all(fetches).then(() => {
			let start = Date.now();
			card.draw(ctx, s);
			this.log(card, "finished drawing in " + (Date.now() - start) + "ms");
			// check whether we have more to do
			this.isRendering = false;
			if (Object.keys(this.renderQuery).length) {
				this.renderTick();
			}
		}).catch((e) => {
			this.error("Error while drawing card:", e);
			this.isRendering = false;
		});
	};

	public getAssetPath(key: string): string {
		return this.options.assetFolder + key + ".png";
	}

	public getAsset(key: string) {
		let path = this.getAssetPath(key);
		let asset = this.assets[path];
		if (!asset) {
			this.error("Missing asset", key, "at", path);
			return;
		}
		if (!asset.loaded) {
			this.error("Attempting to getAsset not loaded", asset, path);
			return;
		}
		return asset;
	}

	public renderTick(): void {
		this.isRendering = true;
		this.options.platform.requestAnimationFrame(() => this.render());
	}

	public createCard(props, width: number, target, callback?: Function): Card {
		let canvas;
		const height = Math.round(width * this.options.aspectRatio);

		if (target && target instanceof HTMLCanvasElement) {
			canvas = target;
			canvas.width = width;
			canvas.height = height;
		} else {
			canvas = this.getBuffer(width, height, true);
		}

		return new Card(this, props, width, canvas, target, callback);
	}
}
