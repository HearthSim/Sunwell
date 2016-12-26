var PLATFORM_NODE = (typeof window == "undefined");
if (PLATFORM_NODE) {
	Promise = require("promise");
	var Canvas = require("canvas");
	Image = Canvas.Image;
}


function cleanEnum(val: string | number, e) {
	if (typeof val === "string") {
		if (val in e) {
			return e[val];
		} else {
			return e["INVALID"];
		}
	}
	return val;
}


function checksum(o: Object): number {
	var s = "";
	var chk = 0x12345678;

	s = s + o["id"];
	s = s + o["playerClass"];
	s = s + o["rarity"];
	s = s + o["set"];
	s = s + o["elite"];
	s = s + o["silenced"];
	s = s + o["costHealth"];
	s = s + o["hideStats"];
	s = s + o["texture"];
	s = s + o["type"];
	s = s + o["width"];
	// Race text is rendered separately, we only need to know that it's displayed
	s = s + !!o["raceText"];

	for (var i = 0; i < s.length; i++) {
		chk += (s.charCodeAt(i) * (i + 1));
	}

	return chk;
}

/**
 * Get the bounding box of a canvas content.
 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
 */
function contextBoundingBox(ctx) {
	var w = ctx.canvas.width, h = ctx.canvas.height;
	var data = ctx.getImageData(0, 0, w, h).data;
	var x, y, minX = 999, minY = 999, maxX = 0, maxY = 0;

	var out = false;

	for (y = h - 1; y > -1; y--) {
		if (out) {
			break;
		}
		for (x = 0; x < w; x++) {
			if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
				maxY = Math.max(maxY, y);
				out = true;
				break;
			}
		}
	}

	if (maxY === undefined) {
		return null;
	}

	out2:
		for (x = w - 1; x > -1; x--) {
			for (y = 0; y < h; y++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					maxX = Math.max(maxX, x);
					break out2;
				}
			}
		}

	out3:
		for (x = 0; x < maxX; x++) {
			for (y = 0; y < h; y++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					minX = Math.min(x, minX);
					break out3;
				}
			}
		}

	out4:
		for (y = 0; y < maxY; y++) {
			for (x = 0; x < w; x++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					minY = Math.min(minY, y);
					break out4;
				}
			}
		}

	return {x: minX, y: minY, maxX: maxX, maxY: maxY, w: maxX - minX, h: maxY - minY};
}


/**
 * Helper function to draw the oval mask for the cards artwork.
 */
function drawEllipse(ctx, x: number, y: number, w: number, h: number): void {
	var kappa = .5522848,
		ox = (w / 2) * kappa, // control point offset horizontal
		oy = (h / 2) * kappa, // control point offset vertical
		xe = x + w, // x-end
		ye = y + h, // y-end
		xm = x + w / 2, // x-middle
		ym = y + h / 2; // y-middle

	ctx.beginPath();
	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	//ctx.closePath(); // not used correctly, see comments (use to close off open path)
	ctx.stroke();
}

/**
 * Finishes a text line and starts a new one.
 */
function finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos: number, yPos: number, totalWidth: number): [number, number] {
	var xCalc = (totalWidth / 2) - (xPos / 2);

	if (xCalc < 0) {
		xCalc = 0;
	}

	if (xPos > 0 && bufferRow.width > 0) {
		bufferTextCtx.drawImage(
			bufferRow,
			0,
			0,
			xPos > bufferRow.width ? bufferRow.width : xPos,
			bufferRow.height,
			xCalc,
			yPos,
			Math.min(xPos, bufferRow.width),
			bufferRow.height
		);
	}

	xPos = 5;
	yPos += bufferRow.height;
	bufferRowCtx.clearRect(0, 0, bufferRow.width, bufferRow.height);

	return [xPos, yPos];
}

/**
 * Given a curve and t, the function returns the point on the curve.
 * r is the rotation of the point in radians.
 * @returns {{x: (number|*), y: (number|*), r: number}}
 */
function getPointOnCurve(curve, t) {
	var rX, rY, x, y;

	rX = 3 * Math.pow(1 - t, 2) * (curve[1].x - curve[0].x) + 6 * (1 - t) * t * (curve[2].x - curve[1].x) + 3 * Math.pow(t, 2) * (curve[3].x - curve[2].x);
	rY = 3 * Math.pow(1 - t, 2) * (curve[1].y - curve[0].y) + 6 * (1 - t) * t * (curve[2].y - curve[1].y) + 3 * Math.pow(t, 2) * (curve[3].y - curve[2].y);

	x = Math.pow((1 - t), 3) * curve[0].x + 3 * Math.pow((1 - t), 2) * t * curve[1].x + 3 * (1 - t) * Math.pow(t, 2) * curve[2].x + Math.pow(t, 3) * curve[3].x;
	y = Math.pow((1 - t), 3) * curve[0].y + 3 * Math.pow((1 - t), 2) * t * curve[1].y + 3 * (1 - t) * Math.pow(t, 2) * curve[2].y + Math.pow(t, 3) * curve[3].y;

	return {x: x, y: y, r: Math.atan2(rY, rX)}
}


var WebPlatform = function() {
	this.buffers = [];
}

WebPlatform.prototype.getBuffer = function(width, height, clear) {
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

enum CardClass {
	INVALID = 0,
	DEATHKNIGHT = 1,
	DRUID = 2,
	HUNTER = 3,
	MAGE = 4,
	PALADIN = 5,
	PRIEST = 6,
	ROGUE = 7,
	SHAMAN = 8,
	WARLOCK = 9,
	WARRIOR = 10,
	DREAM = 11,
	NEUTRAL = 12,
}

enum CardType {
	INVALID = 0,
	HERO = 3,
	MINION = 4,
	SPELL = 5,
	WEAPON = 7,
	HERO_POWER = 10,
}

enum CardSet {
	INVALID = 0,
	CORE = 2,
	EXPERT1 = 3,
	NAXX = 12,
	GVG = 13,
	BRM = 14,
	TGT = 15,
	LOE = 20,
	KARA = 23,
	OG = 21,
	GANGS = 25,
}

enum Race {
	INVALID = 0,
	MURLOC = 14,
	DEMON = 15,
	MECHANICAL = 17,
	PET = 20,
	BEAST = 20,
	TOTEM = 21,
	PIRATE = 23,
	DRAGON = 24,
}

enum Rarity {
	INVALID = 0,
	COMMON = 1,
	FREE = 2,
	RARE = 3,
	EPIC = 4,
	LEGENDARY = 5,
}

enum MultiClassGroup {
	INVALID = 0,
	GRIMY_GOONS = 1,
	JADE_LOTUS = 2,
	KABAL = 3,
}


class Sunwell {
	public options;
	public assets;
	public bodyFontSizeExtra;
	public races;
	public canvas;
	public target;

	private activeRenders;
	private assetListeners;
	private ready;
	private renderQuery;
	private renderCache;

	constructor(options) {
		options.titleFont = options.titleFont || "Belwe";
		options.bodyFont = options.bodyFont || "Franklin Gothic";
		options.bodyFontSize = options.bodyFontSize || 60;
		options.bodyFontOffset = options.bodyFontOffset || {x: 0, y: 0};
		options.bodyLineHeight = options.bodyLineHeight || 50;
		options.assetFolder = options.assetFolder || "/assets/";
		options.autoInit = options.autoInit || true;
		options.platform = options.platform || new WebPlatform();
		options.drawTimeout = options.drawTimeout || 5000;
		options.cacheSkeleton = options.cacheSkeleton || false;
		options.maxActiveRenders = options.maxActiveRenders || 12;
		options.debug = options.debug || false;

		this.options = options;
		this.assets = {};
		this.assetListeners = {};
		this.ready = false;
		this.renderQuery = [];
		this.activeRenders = 0;
		this.renderCache = {};
		this.bodyFontSizeExtra = "";

		if (!PLATFORM_NODE) {
			// we run in node-canvas and we dont support ctx.font="16px/1em" notation
			this.bodyFontSizeExtra = "/1em";
		}

		this.races = {}
		this.races[Race.MURLOC] = {"enUS": "Murloc"};
		this.races[Race.MECHANICAL] = {"enUS": "Mech"};
		this.races[Race.BEAST] = {"enUS": "Beast"};
		this.races[Race.DEMON] = {"enUS": "Demon"};
		this.races[Race.PIRATE] = {"enUS": "Pirate"};
		this.races[Race.DRAGON] = {"enUS": "Dragon"};
		this.races[Race.TOTEM] = {"enUS": "Totem"};

		if (this.options.autoInit) {
			this.init();
		}
	}

	public init(): void {
		this.ready = true;
		if (this.renderQuery.length) {
			this.renderTick();
		}
	}

	public log(...args: any[]): void {
		if (this.options.debug) {
			console.log("[INFO]", arguments);
		}
	}

	public error(...args: any[]): void {
		console.log("[ERROR]", arguments);
	}

	public draw(ctx, card, s: number, cardObj, internalCB: Function): void {
		var sw = card.sunwell,
			t,
			drawTimeout,
			drawProgress = 0,
			renderStart = Date.now();

		var cvs = cardObj.canvas;

		drawTimeout = setTimeout(() => {
			this.error("Drawing", card.name, "timed out at point", drawProgress);
			internalCB();
		}, this.options.drawTimeout);

		if (!card.texture) {
			this.log("No card texture specified. Replacing with an empty texture.");
			t = this.options.platform.getBuffer(1024, 1024);
		}
		else if (typeof card.texture === "string") {
			t = this.getAsset(card.texture);
		} else {
			if (card.texture instanceof Image) {
				t = card.texture;
			} else {
				t = this.options.platform.getBuffer(card.texture.crop.w, card.texture.crop.h);
				(function () {
					var tCtx = t.getContext("2d");
					tCtx.drawImage(card.texture.image, card.texture.crop.x, card.texture.crop.y, card.texture.crop.w, card.texture.crop.h, 0, 0, t.width, t.height);
				})();
			}
		}

		drawProgress = 2;

		ctx.save();
		ctx.clearRect(0, 0, cvs.width, cvs.height);

		// >>>>> Begin Skeleton drawing
		if (this.renderCache[card._cacheKey]) {
			this.log("Skipping skeleton draw");
			ctx.drawImage(this.renderCache[card._cacheKey], 0, 0);
		} else {
			drawProgress = 3;

			ctx.save();
			if (card.type === CardType.MINION) {
				drawEllipse(ctx, 180 * s, 75 * s, 430 * s, 590 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 100 * s, 75 * s, 590 * s, 590 * s);
			}

			if (card.type === CardType.SPELL) {
				ctx.beginPath();
				ctx.rect(125 * s, 165 * s, 529 * s, 434 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 125 * s, 117 * s, 529 * s, 529 * s);
			}

			if (card.type === CardType.WEAPON) {
				drawEllipse(ctx, 150 * s, 135 * s, 476 * s, 468 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 150 * s, 135 * s, 476 * s, 476 * s);
			}
			ctx.restore();

			drawProgress = 4;

			ctx.drawImage(this.getAsset(sw.cardFrame), 0, 0, 764, 1100, 0, 0, cvs.width, cvs.height);

			drawProgress = 5;

			if (card.multiClassGroup && card.type === CardType.MINION) {
				ctx.drawImage(this.getAsset(sw.multiBanner), 0, 0, 184, 369, 17 * s, 88 * s, 184 * s, 369 * s);
			}

			if (card.costHealth) {
				ctx.drawImage(this.getAsset("health"), 0, 0, 167, 218, 24 * s, 62 * s, 167 * s, 218 * s);
				ctx.save();
				ctx.shadowBlur = 50 * s;
				ctx.shadowColor = "#FF7275";
				ctx.shadowOffsetX = 1000;
				ctx.globalAlpha = .5;
				ctx.drawImage(this.getAsset("health"), 0, 0, 167, 218, (24 * s) - 1000, 62 * s, 167 * s, 218 * s);
				ctx.restore();
			} else {
				ctx.drawImage(this.getAsset("gem"), 0, 0, 182, 180, 24 * s, 82 * s, 182 * s, 180 * s);
			}

			drawProgress = 6;

			if (card.type === CardType.MINION) {
				if (sw.rarity) {
					ctx.drawImage(this.getAsset(sw.rarity), 0, 0, 146, 146, 326 * s, 607 * s, 146 * s, 146 * s);
				}

				ctx.drawImage(this.getAsset("title"), 0, 0, 608, 144, 94 * s, 546 * s, 608 * s, 144 * s);

				if (card.raceText) {
					ctx.drawImage(this.getAsset("race"), 0, 0, 529, 106, 125 * s, 937 * s, 529 * s, 106 * s);
				}

				if (!card.hideStats) {
					ctx.drawImage(this.getAsset("attack"), 0, 0, 214, 238, 0, 862 * s, 214 * s, 238 * s);
					ctx.drawImage(this.getAsset("health"), 0, 0, 167, 218, 575 * s, 876 * s, 167 * s, 218 * s);
				}

				if (card.elite) {
					ctx.drawImage(this.getAsset("elite"), 0, 0, 569, 417, 196 * s, 0, 569 * s, 417 * s);
				}
			}

			drawProgress = 7;

			if (card.type === CardType.SPELL) {
				if (sw.rarity) {
					ctx.drawImage(this.getAsset(sw.rarity), 0, 0, 149, 149, 311 * s, 607 * s, 150 * s, 150 * s);
				}

				ctx.drawImage(this.getAsset("title-spell"), 0, 0, 646, 199, 66 * s, 530 * s, 646 * s, 199 * s);
			}

			if (card.type === CardType.WEAPON) {
				if (sw.rarity) {
					ctx.drawImage(this.getAsset(sw.rarity), 0, 0, 146, 144, 315 * s, 592 * s, 146 * s, 144 * s);
				}

				ctx.drawImage(this.getAsset("title-weapon"), 0, 0, 660, 140, 56 * s, 551 * s, 660 * s, 140 * s);

				if (!card.hideStats) {
					ctx.drawImage(this.getAsset("swords"), 0, 0, 312, 306, 32 * s, 906 * s, 187 * s, 183 * s);
					ctx.drawImage(this.getAsset("shield"), 0, 0, 301, 333, 584 * s, 890 * s, 186 * s, 205 * s);
				}
			}

			drawProgress = 8;

			if (card.set !== CardSet.CORE && sw.watermark) {
				ctx.globalCompositeOperation = "color-burn";
				if (card.type === CardType.MINION) {
					if (card.raceText) {
						ctx.drawImage(this.getAsset(sw.watermark), 0, 0, 128, 128, 270 * s, 723 * s, 256 * s, 256 * s);
					} else {
						ctx.drawImage(this.getAsset(sw.watermark), 0, 0, 128, 128, 270 * s, 735 * s, 256 * s, 256 * s);
					}
				} else if (card.type === CardType.SPELL) {
					ctx.globalAlpha = 0.7;
					ctx.drawImage(this.getAsset(sw.watermark), 0, 0, 128, 128, 264 * s, 726 * s, 256 * s, 256 * s);
				} else if (card.type === CardType.WEAPON) {
					ctx.globalCompositeOperation = "lighten";
					ctx.globalAlpha = 0.07;
					ctx.drawImage(this.getAsset(sw.watermark), 0, 0, 128, 128, 264 * s, 735 * s, 256 * s, 256 * s);
				}
				ctx.globalCompositeOperation = "source-over";
				ctx.globalAlpha = 1;
			}

			drawProgress = 9;

			if (this.options.cacheSkeleton) {
				var cacheImage = new Image();
				cacheImage.src = cvs.toDataURL();
				this.renderCache[card._cacheKey] = cacheImage;
			}
		}

		// <<<<<<<< Finished Skeleton drawing

		drawProgress = 10;

		if (!card.hideStats) {
			this.drawNumber(ctx, 116, 170, s, card.cost || 0, 170, card.costStyle);
		}

		drawProgress = 11;

		this.drawCardName(ctx, s, card);

		drawProgress = 12;

		if (card.type === CardType.MINION) {
			if (card.raceText) {
				this.renderRaceText(ctx, s, card.raceText);
			}

			if (!card.hideStats) {
				this.drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
				this.drawNumber(ctx, 668, 994, s, card.health || 0, 150, card.healthStyle);
			}
		}

		drawProgress = 13;

		if (card.type === CardType.WEAPON && !card.hideStats) {
			this.drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
			this.drawNumber(ctx, 668, 994, s, card.durability || 0, 150, card.durabilityStyle);
		}

		drawProgress = 14;

		this.drawBodyText(ctx, s, card, false);

		if (card.silenced && card.type === CardType.MINION) {
			ctx.drawImage(this.getAsset("silence-x"), 0, 0, 410, 397, 200 * s, 660 * s, 410 * s, 397 * s);
		}

		ctx.restore();
		clearTimeout(drawTimeout);

		this.log("Rendertime:", (Date.now() - renderStart), "milliseconds");

		internalCB();

		if (cardObj.target) {
			if (typeof cardObj.target == "function") {
				cardObj.target(cvs);
			} else {
				cardObj.target.src = cvs.toDataURL();
			}
		}
	}

	public drawCardName(targetCtx, s: number, card): void {
		var buffer = this.options.platform.getBuffer(1024, 200);
		var name = card.name;
		var ctx = buffer.getContext("2d");
		ctx.save();

		var pathMiddle = .58;
		var maxWidth = 580;

		// Path midpoint at t = 0.56
		var c = [
			{x: 0, y: 110},
			{x: 102, y: 137},
			{x: 368, y: 16},
			{x: 580, y: 100}
		];

		if (card.type === CardType.SPELL) {
			pathMiddle = .52;
			maxWidth = 580;
			c = [
				{x: 10, y: 100},
				{x: 212, y: 35},
				{x: 368, y: 35},
				{x: 570, y: 105}
			]
		}

		if (card.type === CardType.WEAPON) {
			pathMiddle = .58;
			maxWidth = 580;
			c = [
				{x: 10, y: 75},
				{x: 50, y: 75},
				{x: 500, y: 75},
				{x: 570, y: 75}
			]
		}

		var fontSize = 51;

		ctx.lineWidth = 13;
		ctx.strokeStyle = "black";

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		var textWidth = maxWidth + 1;

		while (textWidth > maxWidth && fontSize > 10) {
			fontSize -= 1;
			ctx.font = fontSize + "px " + this.options.titleFont;
			textWidth = 0;
			for (var i = 0; i < name.length; i++) {
				textWidth += ctx.measureText(name[i]).width + 2;
			}

			textWidth *= 1.25;
		}

		textWidth = textWidth / maxWidth;
		var begin = pathMiddle - (textWidth / 2);
		var steps = textWidth / name.length;

		var p, t, leftPos = 0, m;
		for (i = 0; i < name.length; i++) {
			if (leftPos === 0) {
				t = begin + (steps * i);
				p = getPointOnCurve(c, t);
				leftPos = p.x;
			} else {
				t += 0.01;
				p = getPointOnCurve(c, t);
				while (p.x < leftPos) {
					t += 0.001;
					p = getPointOnCurve(c, t);
				}
			}

			ctx.save();
			ctx.translate(p.x, p.y);

			ctx.scale(1.2, 1);
			//ctx.setTransform(1.2, p.r, 0, 1, p.x, p.y);
			ctx.rotate(p.r);

			ctx.lineWidth = 10 * (fontSize / 50);
			ctx.strokeStyle = "black";
			ctx.fillStyle = "black";
			ctx.fillText(name[i], 0, 0);
			ctx.strokeText(name[i], 0, 0);
			m = ctx.measureText(name[i]).width * 1.25;
			leftPos += m;

			if (["i", "f"].indexOf(name[i]) !== -1) {
				leftPos += m * 0.1;
			}

			ctx.fillStyle = "white";
			ctx.strokeStyle = "white";
			ctx.lineWidth = 2.5 * (fontSize / 50);
			ctx.fillText(name[i], 0, 0);

			ctx.restore();
		}

		targetCtx.drawImage(
			buffer,
			0,
			0,
			580,
			200,

			(395 - (580 / 2)) * s,
			(725 - 200) * s,
			580 * s,
			200 * s
		);

		this.options.platform.freeBuffer(buffer);
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

				_this.log("Requesting asset", path);
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

	public render(): void {
		if (this.activeRenders > this.options.maxActiveRenders) {
			return;
		}

		var card, cardObj;

		if (!this.renderQuery.length) {
			return;
		}

		var renderInfo = this.renderQuery.shift();
		this.activeRenders++;

		card = renderInfo[0];
		cardObj = renderInfo[1];

		var cvs = cardObj.canvas;
		var ctx = cvs.getContext("2d");
		var s = card.width / 764;
		var assetsToLoad = ["silence-x", "health"];

		this.log("Preparing assets for", card.name);

		card.sunwell = card.sunwell || {};

		if (!card.language) {
			card.language = "enUS";
		}

		card.multiClassGroup = cleanEnum(card.multiClassGroup, MultiClassGroup) as MultiClassGroup;
		card.playerClass = cleanEnum(card.playerClass, CardClass) as CardClass;
		card.set = cleanEnum(card.set, CardSet) as CardSet;
		card.type = cleanEnum(card.type, CardType) as CardType;
		card.race = cleanEnum(card.race, Race) as Race;
		card.rarity = cleanEnum(card.rarity, Rarity) as Rarity;

		var sclass = CardClass[card.playerClass];
		var stype = CardType[card.type];
		var srarity = Rarity[card.rarity];
		var smulti = MultiClassGroup[card.multiClassGroup];

		if (card.type == CardType.MINION && card.race && !card.raceText) {
			card.raceText = this.getRaceText(card.race, card.language);
		}

		card.sunwell.cardFrame = "frame-" + stype.toLowerCase() + "-" + sclass.toLowerCase();
		assetsToLoad.push(card.sunwell.cardFrame);
		assetsToLoad.push("gem");

		if (card.type === CardType.MINION) {
			assetsToLoad.push("attack", "title");

			if (card.elite) {
				assetsToLoad.push("elite");
			}

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "rarity-" + srarity.toLowerCase();
				assetsToLoad.push(card.sunwell.rarity);
			}
		}

		if (card.type === CardType.SPELL) {
			assetsToLoad.push("attack", "title-spell");

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "spell-rarity-" + srarity.toLowerCase();
				assetsToLoad.push(card.sunwell.rarity);
			}
		}

		if (card.type === CardType.WEAPON) {
			assetsToLoad.push("swords", "shield", "title-weapon");

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "weapon-rarity-" + srarity.toLowerCase();
				assetsToLoad.push(card.sunwell.rarity);
			}
		}

		var watermark = this.getWatermarkAsset(card.set);
		if (watermark) {
			card.sunwell.watermark = watermark;
			assetsToLoad.push(watermark);
		}

		if (card.raceText) {
			assetsToLoad.push("race");
		}

		if (card.multiClassGroup) {
			card.sunwell.multiBanner = "multi-" + smulti.toLowerCase();
			assetsToLoad.push(card.sunwell.multiBanner);
		}

		var texturesToLoad = [];

		if (card.texture && typeof card.texture === "string") {
			texturesToLoad.push(card.texture);
		}

		for (var i in assetsToLoad) {
			var path = this.getAssetPath(assetsToLoad[i]);
			texturesToLoad.push(path);
		}

		this.log("Preparing to load assets");
		var fetches = [];
		for (var i in texturesToLoad) {
			fetches.push(this.fetchAsset(texturesToLoad[i]));
		}

		Promise.all(fetches).then(() => {
			this.draw(ctx, card, s, cardObj, () => {
				this.activeRenders--;
				this.log("Finished drawing", card.name);
			});
		}).catch((e) => { this.error("Error while drawing card:", e) }
		);
	};

	public renderRaceText(targetCtx, s: number, raceText: string): void {
		var buffer = this.options.platform.getBuffer(300, 60);
		var bufferCtx = buffer.getContext("2d");
		var x = 10;
		var text = raceText.split("");

		bufferCtx.font = "45px " + this.options.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";
		bufferCtx.textAlign = "left";

		for (var i = 0; i < text.length; i++) {
			bufferCtx.lineWidth = 8;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(text[i], x, 10);
			bufferCtx.strokeText(text[i], x, 10);

			bufferCtx.fillStyle = "white";
			bufferCtx.strokeStyle = "white";
			bufferCtx.lineWidth = 1;
			bufferCtx.fillText(text[i], x, 10);
			//ctx.strokeText(text[i], x, y);

			x += bufferCtx.measureText(text[i]).width;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (394 - (b.w / 2)) * s, (1001 - (b.h / 2)) * s, b.w * s, b.h * s);

		this.options.platform.freeBuffer(buffer);
	}

	public getAssetPath(key: string): string {
		return this.options.assetFolder + key + ".png";
	}

	public getAsset(key: string) {
		var asset = this.assets[this.getAssetPath(key)];
		if (!asset.loaded) {
			this.error("Attempting to getAsset not loaded", asset);
			return;
		}
		return asset;
	}

	public getRaceText(race: Race, lang: string): string {
		if (race in this.races) {
			return this.races[race]["enUS"];
		}
		return "";
	}

	public getWatermarkAsset(set: CardSet): string {
		switch(set) {
			case CardSet.EXPERT1: return "set-classic";
			case CardSet.NAXX: return "set-naxx";
			case CardSet.GVG: return "set-gvg";
			case CardSet.BRM: return "set-brm";
			case CardSet.TGT: return "set-tgt";
			case CardSet.LOE: return "set-loe";
			case CardSet.OG: return "set-og";
			case CardSet.KARA: return "set-kara";
			case CardSet.GANGS: return "set-gangs";
		}
		return "";
	}

	public drawBodyText(targetCtx, s: number, card, forceSmallerFirstLine: boolean): void {
		var cardText = card.text;

		if (!card.text) {
			return;
		}
		if (card.collectionText) {
			cardText = card.collectionText;
		}

		var manualBreak = cardText.substr(0, 3) === "[x]",
			bodyText = manualBreak ? cardText.substr(3) : cardText,
			word,
			chars,
			char,
			xPos = 0,
			yPos = 0,
			isBold = 0,
			isItalic = 0,
			justLineBreak,
			lineCount = 0,
			plurals,
			pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g,
			pBodyText;

		pBodyText = bodyText;
		while ((plurals = pluralRegex.exec(bodyText)) !== null) {
			pBodyText = pBodyText.replace(plurals[0], plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4]));
		}
		bodyText = pBodyText;

		var words = bodyText.replace(/[\$#_]/g, "").split(/( |\n)/g);

		this.log("Rendering body", bodyText);

		var centerLeft = 390;
		var centerTop = 860;
		var bufferText = this.options.platform.getBuffer();
		var bufferTextCtx = bufferText.getContext("2d");

		var bufferRow = this.options.platform.getBuffer();
		var bufferRowCtx = bufferRow.getContext("2d");

		if (card.type === CardType.MINION) {
			bufferText.width = 520;
			bufferText.height = 290;
			bufferRow.width = 520;
		}

		if (card.type === CardType.SPELL) {
			bufferText.width = 460;
			bufferText.height = 290;
			bufferRow.width = 460;
		}

		if (card.type === CardType.WEAPON) {
			bufferText.width = 470;
			bufferText.height = 250;
			bufferRow.width = 470;
		}

		var fontSize = this.options.bodyFontSize;
		var lineHeight = this.options.bodyLineHeight;
		var totalLength = cardText.replace(/<\/*.>/g, "").length;
		var smallerFirstLine = false;

		if (totalLength >= 80) {
			fontSize = this.options.bodyFontSize * 0.9;
			lineHeight = this.options.bodyLineHeight * 0.9;
		}

		if (totalLength >= 100) {
			fontSize = this.options.bodyFontSize * 0.8;
			lineHeight = this.options.bodyLineHeight * 0.8;
		}

		bufferRow.height = lineHeight;

		if (forceSmallerFirstLine || (totalLength >= 75 && card.type === CardType.SPELL)) {
			smallerFirstLine = true;
		}

		if (card.type === CardType.WEAPON) {
			bufferRowCtx.fillStyle = "#fff";
		} else {
			bufferRowCtx.fillStyle = "#000";
		}

		bufferRowCtx.textBaseline = this.options.bodyBaseline;

		var spaceWidth = 3;
		var baseFontmaterial = fontSize + "px" + this.bodyFontSizeExtra + " '" + this.options.bodyFont + "', sans-serif";
		bufferRowCtx.font = baseFontmaterial;

		var getFontMaterial = function() {
			return (isBold > 0 ? "bold " : "") + (isItalic > 0 ? "italic " : "") + baseFontmaterial;
		}

		for (var i = 0; i < words.length; i++) {
			word = words[i];
			chars = word.split("");

			var width = bufferRowCtx.measureText(word).width;
			this.log("Next word:", word);

			if (!manualBreak && (xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8))) {
				this.log((xPos + width), ">", bufferRow.width);
				this.log("Calculated line break");
				smallerFirstLine = false;
				lineCount++;
				var r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
				xPos = r[0];
				yPos = r[1];
				justLineBreak = true;
			}

			for (var j = 0; j < chars.length; j++) {
				char = chars[j];

				if (char === "\n") {
					if (justLineBreak) {
						justLineBreak = false;
						continue;
					}
					lineCount++;
					var r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
					xPos = r[0];
					yPos = r[1];
					this.log("Manual line break");
					continue;
				}

				justLineBreak = false;

				// <b>
				if (char === "<" && chars[j + 1] === "b" && chars[j + 2] === ">") {
					isBold++;
					j += 2;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// </b>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "b" && chars[j + 3] === ">") {
					isBold--;
					j += 3;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// <i>
				if (char === "<" && chars[j + 1] === "i" && chars[j + 2] === ">") {
					isItalic++;
					j += 2;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// </i>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "i" && chars[j + 3] === ">") {
					isItalic--;
					j += 3;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				bufferRowCtx.fillText(char, xPos + this.options.bodyFontOffset.x, this.options.bodyFontOffset.y);

				xPos += bufferRowCtx.measureText(char).width + (spaceWidth / 8);
			}

			xPos += spaceWidth;
		}

		lineCount++;
		finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);

		this.options.platform.freeBuffer(bufferRow);

		if (card.type === CardType.SPELL && lineCount === 4) {
			if (!smallerFirstLine && !forceSmallerFirstLine) {
				this.drawBodyText(targetCtx, s, card, true);
				return;
			}
		}

		var b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		targetCtx.drawImage(bufferText, b.x, b.y - 2, b.w, b.h, (centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);

		this.options.platform.freeBuffer(bufferText);
	}

	/**
	 * Renders a given number to the defined position.
	 * The x/y position should be the position on an unscaled card.
	 */
	public drawNumber(targetCtx, x: number, y: number, s: number, number, size, drawStyle): void {
		var buffer = this.options.platform.getBuffer();
		var bufferCtx = buffer.getContext("2d");

		if (drawStyle === undefined) {
			drawStyle = "0";
		}

		buffer.width = 256;
		buffer.height = 256;

		number = number.toString();

		number = number.split("");

		var tX = 10;

		bufferCtx.font = size + "px " + this.options.titleFont;

		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";

		bufferCtx.textAlign = "left";

		var color = "white";

		if (drawStyle === "-") {
			color = "#f00";
		}

		if (drawStyle === "+") {
			color = "#0f0";
		}

		for (var i = 0; i < number.length; i++) {
			bufferCtx.lineWidth = 13;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(number[i], tX, 10);
			bufferCtx.strokeText(number[i], tX, 10);

			bufferCtx.fillStyle = color;
			bufferCtx.strokeStyle = color;
			bufferCtx.lineWidth = 2.5;
			bufferCtx.fillText(number[i], tX, 10);
			//ctx.strokeText(text[i], x, y);

			tX += bufferCtx.measureText(number[i]).width;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (x - (b.w / 2)) * s, (y - (b.h / 2)) * s, b.w * s, b.h * s);

		this.options.platform.freeBuffer(buffer);
	}

	public renderTick(): void {
		if (!this.ready) {
			return;
		}
		this.render();

		if (PLATFORM_NODE) {
			var callback = this.renderTick.bind(this);
			setTimeout(callback, 16);
		} else {
			window.requestAnimationFrame(this.renderTick);
		}
	}

	public Card(props, width: number, renderTarget): void {
		var height = Math.round(width * 1.4397905759);

		if (!props) {
			throw new Error("No card properties given");
		}

		if (renderTarget) {
			if (PLATFORM_NODE || renderTarget instanceof HTMLImageElement) {
				this.target = renderTarget;
			} else if (renderTarget instanceof HTMLCanvasElement) {
				this.canvas = renderTarget;
				this.canvas.width = width;
				this.canvas.height = height;
			}
		} else {
			this.target = new Image();
		}

		if (!this.canvas) {
			this.canvas = this.options.platform.getBuffer(width, height, true)
		}

		props.costStyle = props.costStyle || "0";
		props.healthStyle = props.healthStyle || "0";
		props.attackStyle = props.attackStyle || "0";
		props.durabilityStyle = props.durabilityStyle || "0";

		props.silenced = props.silenced || false;
		props.costHealth = props.costHealth || false;

		props.width = width;

		props._cacheKey = checksum(props);

		this.log("Queried render:", props.name);

		this.renderQuery.push([props, this]);
		if (!this.activeRenders) {
			this.renderTick();
		}
	}

	public createCard(props, width: number, renderTarget): void {
		return this.Card(props, width, renderTarget);
	}
}

module.exports = Sunwell;
