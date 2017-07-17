/*#if _PLATFORM == "node"
import Platform from "./platforms/NodePlatform.ts";
//#else */
import Platform from "./platforms/WebPlatform";
//#endif

import Card from "./Card";
import HeroCard from "./HeroCard";
import MinionCard from "./MinionCard";
import SpellCard from "./SpellCard";
import WeaponCard from "./WeaponCard";

interface ISunwellOptions {
	titleFont: string;
	bodyFontRegular: string;
	bodyFontBold: string;
	bodyFontItalic: string;
	aspectRatio: number;
	bodyFontSize: number;
	bodyFontOffset: {x: number; y: number};
	bodyLineHeight: number;
	assetFolder: string;
	drawTimeout: number;
	cacheSkeleton: boolean;
	debug: boolean;
}

export default class Sunwell {
	public options: ISunwellOptions;
	public assets: {[key: string]: HTMLImageElement};
	public canvas: HTMLCanvasElement;
	public target: any;
	public platform: Platform;
	public renderCache: {[cacheKey: string]: any};

	private assetListeners: {[path: string]: Array<(HTMLCanvasElement) => void>};
	private renderQuery: {[key: string]: Card};
	private isRendering: boolean;

	constructor(options: ISunwellOptions) {
		options.titleFont = options.titleFont || "Belwe";
		options.bodyFontRegular = options.bodyFontRegular || "Franklin Gothic";
		options.bodyFontBold = options.bodyFontBold || options.bodyFontRegular;
		options.bodyFontItalic = options.bodyFontItalic || options.bodyFontRegular;
		options.aspectRatio = options.aspectRatio || 1.4397905759;
		options.bodyFontSize = options.bodyFontSize || 60;
		options.bodyFontOffset = options.bodyFontOffset || {x: 0, y: 0};
		options.bodyLineHeight = options.bodyLineHeight || 50;
		options.assetFolder = options.assetFolder || "/assets/";
		options.drawTimeout = options.drawTimeout || 5000;
		options.cacheSkeleton = options.cacheSkeleton || false;
		options.debug = options.debug || false;

		this.platform = new Platform();
		this.options = options;
		this.assets = {};
		this.assetListeners = {};
		this.renderQuery = {};
		this.renderCache = {};
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
		const assets = this.assets;
		const assetListeners = this.assetListeners;
		const sw = this;

		return new this.platform.Promise(resolve => {
			if (assets[path] === undefined) {
				assets[path] = new sw.platform.Image();
				assets[path].crossOrigin = "Anonymous";

				sw.log("Requesting", path);
				sw.platform.loadAsset(
					assets[path],
					path,
					() => {
						if (assetListeners[path]) {
							for (const listener of assetListeners[path]) {
								listener(assets[path]);
							}
							delete assetListeners[path];
						}
						resolve();
					},
					() => {
						sw.error("Error loading asset:", path);
						// An asset load error should not reject the promise
						resolve();
					}
				);
			} else if (!assets[path].complete) {
				assetListeners[path] = assetListeners[path] || [];
				assetListeners[path].push(resolve);
			} else {
				resolve();
			}
		});
	}

	public getBuffer(width?: number, height?: number, clear?: boolean): HTMLCanvasElement {
		return this.platform.getBuffer(width, height, clear);
	}

	public freeBuffer(buffer: HTMLCanvasElement) {
		return this.platform.freeBuffer(buffer);
	}

	public render(): void {
		const keys = Object.keys(this.renderQuery);
		if (!keys.length) {
			return;
		}

		const first = keys[0];
		const card = this.renderQuery[first];
		delete this.renderQuery[first];

		const context = card.canvas.getContext("2d");

		this.log("Preparing assets for", card.name);

		const texturesToLoad: string[] = [];

		if (card.texture && typeof card.texture === "string") {
			texturesToLoad.push(card.texture);
		}

		for (const asset of card.getAssetsToLoad()) {
			const path = this.getAssetPath(asset);
			if (!this.assets[path] || !this.assets[path].complete) {
				texturesToLoad.push(path);
			}
		}

		this.log("Preparing to load assets");
		const fetches: Array<Promise<{}>> = [];
		for (const texture of texturesToLoad) {
			fetches.push(this.fetchAsset(texture));
		}

		this.platform.Promise
			.all(fetches)
			.then(() => {
				const start = Date.now();
				card.draw(card.canvas, context);
				this.log(card, "finished drawing in " + (Date.now() - start) + "ms");
				// check whether we have more to do
				this.isRendering = false;
				if (Object.keys(this.renderQuery).length) {
					this.renderTick();
				}
			})
			.catch(e => {
				this.error("Error while drawing card:", e);
				this.isRendering = false;
			});
	}

	public getAssetPath(key: string): string {
		return this.options.assetFolder + key + ".png";
	}

	public getAsset(key: string) {
		const path = this.getAssetPath(key);
		const asset = this.assets[path];
		if (!asset) {
			this.error("Missing asset", key, "at", path);
			return;
		}
		if (!asset.complete) {
			this.error("Attempting to getAsset not loaded", asset, path);
			return;
		}
		return asset;
	}

	public renderTick(): void {
		this.isRendering = true;
		this.platform.requestAnimationFrame(() => this.render());
	}

	public createCard(props, width: number, target, callback?: (HTMLCanvasElement) => void): Card {
		let canvas: HTMLCanvasElement;
		const height = Math.round(width * this.options.aspectRatio);

		if (target && target instanceof HTMLCanvasElement) {
			canvas = target;
			canvas.width = width;
			canvas.height = height;
		} else {
			canvas = this.getBuffer(width, height, true);
		}

		const ctors: {[type: string]: any} = {
			HERO: HeroCard,
			MINION: MinionCard,
			SPELL: SpellCard,
			WEAPON: WeaponCard,
		};

		const ctor = ctors[props.type];
		if (!ctor) {
			throw new Error("Got an unrenderable card type");
		}

		const card: Card = new ctor(this, props);
		card.canvas = canvas;
		card.initRender(width, target, callback);

		this.log("Queried render:", card.name);
		if (this.renderQuery[card.key]) {
			this.log("Skipping", card.key, "(already queued)");
		} else {
			this.renderQuery[card.key] = card;
			if (!this.isRendering) {
				this.renderTick();
			}
		}

		return card;
	}
}
