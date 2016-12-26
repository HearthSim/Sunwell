import Sunwell from "./sunwell";


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
 * Get the bounding box of a canvas content.
 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
 */
function contextBoundingBox(ctx) {
	var w = ctx.canvas.width, h = ctx.canvas.height;
	var data = ctx.getImageData(0, 0, w, h).data;
	var minX = 999, minY = 999, maxX = 0, maxY = 0;

	var out = false;

	for (let y = h - 1; y > -1; y--) {
		if (out) {
			break;
		}
		for (let x = 0; x < w; x++) {
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
		for (let x = w - 1; x > -1; x--) {
			for (let y = 0; y < h; y++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					maxX = Math.max(maxX, x);
					break out2;
				}
			}
		}

	out3:
		for (let x = 0; x < maxX; x++) {
			for (let y = 0; y < h; y++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					minX = Math.min(x, minX);
					break out3;
				}
			}
		}

	out4:
		for (let y = 0; y < maxY; y++) {
			for (let x = 0; x < w; x++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					minY = Math.min(minY, y);
					break out4;
				}
			}
		}

	return {x: minX, y: minY, maxX: maxX, maxY: maxY, w: maxX - minX, h: maxY - minY};
}


function getNumberStyle(style: string) {
	switch (style) {
		case "-": return "#f00";
		case "+": return "#0f0";
		default: return "white";
	}
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

	return {x: x, y: y, r: Math.atan2(rY, rX)};
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

enum CardType {
	INVALID = 0,
	HERO = 3,
	MINION = 4,
	SPELL = 5,
	WEAPON = 7,
	HERO_POWER = 10,
}


var RaceNames = {}
RaceNames[Race.MURLOC] = {"enUS": "Murloc"};
RaceNames[Race.MECHANICAL] = {"enUS": "Mech"};
RaceNames[Race.BEAST] = {"enUS": "Beast"};
RaceNames[Race.DEMON] = {"enUS": "Demon"};
RaceNames[Race.PIRATE] = {"enUS": "Pirate"};
RaceNames[Race.DRAGON] = {"enUS": "Dragon"};
RaceNames[Race.TOTEM] = {"enUS": "Totem"};


export default class Card {
	public canvas;
	public target;
	public sunwell;
	public texture;
	public id: string;
	public name: string;
	public bodyText: string;
	public raceText: string;
	public cost: number;
	public attack: number;
	public health: number;
	public cardClass: CardClass;
	public rarity: Rarity;
	public race: Race;
	public set: CardSet;
	public multiClassGroup: MultiClassGroup;
	public hideStats: boolean;
	public type: CardType;
	public elite: boolean;
	public costsHealth: boolean;
	public silenced: boolean;
	public language: string;
	public titleFont: string;
	public costColor: string;
	public attackColor: string;
	public healthColor: string;
	public width: number;

	private cacheKey: number;
	private cardFrameAsset: string;
	private rarityGemAsset: string;
	private multiBannerAsset: string;
	private watermarkAsset: string;

	constructor(sunwell: Sunwell, props, width: number, renderTarget) {
		var height = Math.round(width * 1.4397905759);
		this.sunwell = sunwell;

		if (!props) {
			throw new Error("No card properties given");
		}

		if (renderTarget) {
			if (typeof window === "undefined" || renderTarget instanceof HTMLImageElement) {
				this.target = renderTarget;
			} else if (renderTarget instanceof HTMLCanvasElement) {
				this.canvas = renderTarget;
				this.canvas.width = width;
				this.canvas.height = height;
			}
		} else {
			this.target = new this.sunwell.platform.Image();
		}

		if (!this.canvas) {
			this.canvas = sunwell.getBuffer(width, height, true);
		}

		this.width = width;
		this.type = props.type;
		this.cost = props.cost || 0;
		this.attack = props.attack || 0;
		this.health = props.health || 0;
		this.costColor = getNumberStyle(props.costStyle);
		this.attackColor = getNumberStyle(props.costStyle);
		this.healthColor = getNumberStyle(props.healthStyle);
		this.costsHealth = props.costHealth || false;
		this.elite = props.elite || false;
		this.cacheKey = this.checksum();
		this.hideStats = props.hideStats;
		this.silenced = props.silenced || false;
		this.language = props.language || "enUS";
		this.name = props.name || "";

		if (this.type === CardType.WEAPON && props.durability) {
			// Weapons alias health to durability
			this.health = props.durability;
		}

		this.multiClassGroup = cleanEnum(props.multiClassGroup, MultiClassGroup) as MultiClassGroup;
		this.cardClass = cleanEnum(props.playerClass, CardClass) as CardClass;
		this.set = cleanEnum(props.set, CardSet) as CardSet;
		this.type = cleanEnum(props.type, CardType) as CardType;
		this.race = cleanEnum(props.race, Race) as Race;
		this.rarity = cleanEnum(props.rarity, Rarity) as Rarity;

		let rarityGem = this.getRarityGemAsset();
		if (rarityGem) {
			this.rarityGemAsset = rarityGem;
		}

		var sclass = CardClass[this.cardClass].toLowerCase();
		var stype = CardType[this.type].toLowerCase();

		this.cardFrameAsset = "frame-" + stype + "-" + sclass;
		if (this.multiClassGroup && this.type === CardType.MINION) {
			let smulti = MultiClassGroup[this.multiClassGroup];
			this.multiBannerAsset = "multi-" + smulti.toLowerCase();
		}

		let watermark = this.getWatermarkAsset();
		if (watermark) {
			this.watermarkAsset = watermark;
		}

		if (this.type === CardType.MINION) {
			this.raceText = props.raceText || this.getRaceText();
		}
		this.bodyText = props.collectionText || props.text;
		this.titleFont = sunwell.options.titleFont;
		this.texture = props.texture;

		sunwell.prepareRenderingCard(this);
	}

	private checksum(): number {
		let s = "";
		let chk = 0x12345678;

		s = s + this.id +
			this.cardClass +
			this.rarity +
			this.set +
			this.elite +
			this.silenced +
			this.costsHealth +
			this.hideStats +
			this.texture +
			this.type +
			this.width

		// Race text is rendered separately, we only need to know that it's displayed
		s += !!this.raceText

		for (let i = 0; i < s.length; i++) {
			chk += (s.charCodeAt(i) * (i + 1));
		}

		return chk;
	}

	public getAssetsToLoad(): Array<string> {
		var assetsToLoad: Array<string> = [this.cardFrameAsset];
		assetsToLoad.push("gem");

		if (this.rarityGemAsset) {
			assetsToLoad.push(this.rarityGemAsset);
		}

		switch (this.type) {
			case CardType.MINION:
				assetsToLoad.push("title");
				if (!this.hideStats) {
					assetsToLoad.push("attack", "health");
				}
				if (this.silenced) {
					assetsToLoad.push("silence-x");
				}
				if (this.elite) {
					assetsToLoad.push("elite");
				}

			case CardType.SPELL:
				assetsToLoad.push("title-spell");

			case CardType.WEAPON:
				assetsToLoad.push("title-weapon", "swords", "shield");
		}

		if (this.watermarkAsset) {
			assetsToLoad.push(this.watermarkAsset);
		}

		if (this.raceText) {
			assetsToLoad.push("race");
		}

		return assetsToLoad;
	}

	public getCardArtTexture() {
		if (!this.texture) {
			this.sunwell.log("No card texture specified. Creating empty texture.");
			return this.sunwell.getBuffer(1024, 1024);
		} else if (this.texture instanceof this.sunwell.platform.Image) {
			return this.texture;
		} else if (typeof this.texture === "string") {
			return this.sunwell.assets[this.texture];
		} else {
			let t = this.sunwell.getBuffer(this.texture.crop.w, this.texture.crop.h);
			var tCtx = t.getContext("2d");
			tCtx.drawImage(
				this.texture.image,
				this.texture.crop.x, this.texture.crop.y,
				this.texture.crop.w, this.texture.crop.h,
				0, 0, t.width, t.height
			);
			return t;
		}
	}

	public getRaceText(): string {
		if (this.race && this.type == CardType.MINION && this.race in RaceNames) {
			return RaceNames[this.race][this.language];
		}
		return "";
	}

	public getRarityGemAsset(): string {
		if (this.rarity == Rarity.FREE || (this.rarity == Rarity.COMMON && this.set == CardSet.CORE)) {
			return "";
		}

		let srarity = Rarity[this.rarity].toLowerCase();
		switch (this.type) {
			case CardType.MINION: return "rarity-" + srarity;
			case CardType.SPELL: return "spell-rarity-" + srarity;
			case CardType.WEAPON: return "weapon-rarity-" + srarity;
		}
		return "";
	}

	public getWatermarkAsset(): string {
		switch(this.set) {
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

	public draw(ctx, s: number): void {
		var drawProgress = 0;
		var renderStart = Date.now();

		var cvs = this.canvas;

		var drawTimeout = setTimeout(() => {
			this.sunwell.error("Drawing", this.name, "timed out at point", drawProgress);
			this.sunwell.activeRenders--;
		}, this.sunwell.options.drawTimeout);

		let t = this.getCardArtTexture();

		drawProgress = 2;

		ctx.save();
		ctx.clearRect(0, 0, cvs.width, cvs.height);

		// >>>>> Begin Skeleton drawing
		if (this.sunwell.renderCache[this.cacheKey]) {
			this.sunwell.log("Skipping skeleton draw");
			ctx.drawImage(this.sunwell.renderCache[this.cacheKey], 0, 0);
		} else {
			drawProgress = 3;

			ctx.save();
			if (this.type === CardType.MINION) {
				drawEllipse(ctx, 180 * s, 75 * s, 430 * s, 590 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 100 * s, 75 * s, 590 * s, 590 * s);
			}

			if (this.type === CardType.SPELL) {
				ctx.beginPath();
				ctx.rect(125 * s, 165 * s, 529 * s, 434 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 125 * s, 117 * s, 529 * s, 529 * s);
			}

			if (this.type === CardType.WEAPON) {
				drawEllipse(ctx, 150 * s, 135 * s, 476 * s, 468 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 150 * s, 135 * s, 476 * s, 476 * s);
			}
			ctx.restore();

			drawProgress = 4;

			ctx.drawImage(this.sunwell.getAsset(this.cardFrameAsset), 0, 0, 764, 1100, 0, 0, cvs.width, cvs.height);

			drawProgress = 5;

			if (this.multiBannerAsset) {
				ctx.drawImage(this.sunwell.getAsset(this.multiBannerAsset), 0, 0, 184, 369, 17 * s, 88 * s, 184 * s, 369 * s);
			}

			if (this.costsHealth) {
				ctx.drawImage(this.sunwell.getAsset("health"), 0, 0, 167, 218, 24 * s, 62 * s, 167 * s, 218 * s);
				ctx.save();
				ctx.shadowBlur = 50 * s;
				ctx.shadowColor = "#FF7275";
				ctx.shadowOffsetX = 1000;
				ctx.globalAlpha = .5;
				ctx.drawImage(this.sunwell.getAsset("health"), 0, 0, 167, 218, (24 * s) - 1000, 62 * s, 167 * s, 218 * s);
				ctx.restore();
			} else {
				ctx.drawImage(this.sunwell.getAsset("gem"), 0, 0, 182, 180, 24 * s, 82 * s, 182 * s, 180 * s);
			}

			drawProgress = 6;

			if (this.rarityGemAsset) {
				this.drawRarityGem(ctx, s, this.sunwell.getAsset(this.rarityGemAsset));
			}

			if (this.type === CardType.MINION) {
				ctx.drawImage(this.sunwell.getAsset("title"), 0, 0, 608, 144, 94 * s, 546 * s, 608 * s, 144 * s);

				if (this.raceText) {
					ctx.drawImage(this.sunwell.getAsset("race"), 0, 0, 529, 106, 125 * s, 937 * s, 529 * s, 106 * s);
				}

				if (!this.hideStats) {
					ctx.drawImage(this.sunwell.getAsset("attack"), 0, 0, 214, 238, 0, 862 * s, 214 * s, 238 * s);
					ctx.drawImage(this.sunwell.getAsset("health"), 0, 0, 167, 218, 575 * s, 876 * s, 167 * s, 218 * s);
				}

				if (this.elite) {
					ctx.drawImage(this.sunwell.getAsset("elite"), 0, 0, 569, 417, 196 * s, 0, 569 * s, 417 * s);
				}
			}

			drawProgress = 7;

			if (this.type === CardType.SPELL) {
				ctx.drawImage(this.sunwell.getAsset("title-spell"), 0, 0, 646, 199, 66 * s, 530 * s, 646 * s, 199 * s);
			}

			if (this.type === CardType.WEAPON) {
				ctx.drawImage(this.sunwell.getAsset("title-weapon"), 0, 0, 660, 140, 56 * s, 551 * s, 660 * s, 140 * s);

				if (!this.hideStats) {
					ctx.drawImage(this.sunwell.getAsset("swords"), 0, 0, 312, 306, 32 * s, 906 * s, 187 * s, 183 * s);
					ctx.drawImage(this.sunwell.getAsset("shield"), 0, 0, 301, 333, 584 * s, 890 * s, 186 * s, 205 * s);
				}
			}

			drawProgress = 8;

			if (this.watermarkAsset) {
				this.drawWatermarkAsset(ctx, s, this.sunwell.getAsset(this.watermarkAsset));
			}

			drawProgress = 9;

			if (this.sunwell.options.cacheSkeleton) {
				var cacheImage = new Image();
				cacheImage.src = cvs.toDataURL();
				this.sunwell.renderCache[this.cacheKey] = cacheImage;
			}
		}

		// <<<<<<<< Finished Skeleton drawing

		drawProgress = 10;

		if (!this.hideStats) {
			this.drawNumber(ctx, 116, 170, s, this.cost, 170, this.costColor);
		}

		drawProgress = 11;

		this.drawName(ctx, s, this.name);

		drawProgress = 12;

		this.drawStats(ctx, s);

		drawProgress = 13;

		if (this.raceText) {
			this.drawRaceText(ctx, s, this.raceText);
		}

		drawProgress = 14;

		this.drawBodyText(ctx, s, false, this.bodyText);

		if (this.silenced && this.type === CardType.MINION) {
			ctx.drawImage(this.sunwell.getAsset("silence-x"), 0, 0, 410, 397, 200 * s, 660 * s, 410 * s, 397 * s);
		}

		ctx.restore();
		clearTimeout(drawTimeout);

		this.sunwell.log("Rendertime:", (Date.now() - renderStart), "milliseconds");

		if (this.target) {
			if (typeof this.target == "function") {
				this.target(cvs);
			} else {
				this.target.src = cvs.toDataURL();
			}
		}

		this.sunwell.log("Finished drawing", this.name);
		this.sunwell.activeRenders--;
	}

	public drawBodyText(targetCtx, s: number, forceSmallerFirstLine: boolean, text: string): void {
		var manualBreak = text.substr(0, 3) === "[x]";
		var bodyText = manualBreak ? text.substr(3) : text;
		if (!bodyText) {
			return;
		}

		var word,
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

		this.sunwell.log("Rendering body", bodyText);

		var centerLeft = 390;
		var centerTop = 860;
		var bufferText = this.sunwell.getBuffer();
		var bufferTextCtx = bufferText.getContext("2d");

		var bufferRow = this.sunwell.getBuffer();
		var bufferRowCtx = bufferRow.getContext("2d");

		if (this.type === CardType.MINION) {
			bufferText.width = 520;
			bufferText.height = 290;
			bufferRow.width = 520;
		}

		if (this.type === CardType.SPELL) {
			bufferText.width = 460;
			bufferText.height = 290;
			bufferRow.width = 460;
		}

		if (this.type === CardType.WEAPON) {
			bufferText.width = 470;
			bufferText.height = 250;
			bufferRow.width = 470;
		}

		var fontSize = this.sunwell.options.bodyFontSize;
		var lineHeight = this.sunwell.options.bodyLineHeight;
		var totalLength = bodyText.replace(/<\/*.>/g, "").length;
		var smallerFirstLine = false;

		if (totalLength >= 80) {
			fontSize = this.sunwell.options.bodyFontSize * 0.9;
			lineHeight = this.sunwell.options.bodyLineHeight * 0.9;
		}

		if (totalLength >= 100) {
			fontSize = this.sunwell.options.bodyFontSize * 0.8;
			lineHeight = this.sunwell.options.bodyLineHeight * 0.8;
		}

		bufferRow.height = lineHeight;

		if (forceSmallerFirstLine || (totalLength >= 75 && this.type === CardType.SPELL)) {
			smallerFirstLine = true;
		}

		if (this.type === CardType.WEAPON) {
			bufferRowCtx.fillStyle = "#fff";
		} else {
			bufferRowCtx.fillStyle = "#000";
		}

		bufferRowCtx.textBaseline = this.sunwell.options.bodyBaseline;

		var spaceWidth = 3;
		var baseFontmaterial = fontSize + "px" + this.sunwell.bodyFontSizeExtra + " '" + this.sunwell.options.bodyFont + "', sans-serif";
		bufferRowCtx.font = baseFontmaterial;

		var getFontMaterial = function() {
			return (isBold > 0 ? "bold " : "") + (isItalic > 0 ? "italic " : "") + baseFontmaterial;
		}

		for (var i = 0; i < words.length; i++) {
			word = words[i];
			chars = word.split("");

			var width = bufferRowCtx.measureText(word).width;
			this.sunwell.log("Next word:", word);

			if (!manualBreak && (xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8))) {
				this.sunwell.log((xPos + width), ">", bufferRow.width);
				this.sunwell.log("Calculated line break");
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
					this.sunwell.log("Manual line break");
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

				bufferRowCtx.fillText(char, xPos + this.sunwell.options.bodyFontOffset.x, this.sunwell.options.bodyFontOffset.y);

				xPos += bufferRowCtx.measureText(char).width + (spaceWidth / 8);
			}

			xPos += spaceWidth;
		}

		lineCount++;
		finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);

		this.sunwell.freeBuffer(bufferRow);

		if (this.type === CardType.SPELL && lineCount === 4) {
			if (!smallerFirstLine && !forceSmallerFirstLine) {
				this.drawBodyText(targetCtx, s, true, this.bodyText);
				return;
			}
		}

		var b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		targetCtx.drawImage(bufferText, b.x, b.y - 2, b.w, b.h, (centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);

		this.sunwell.freeBuffer(bufferText);
	}

	public drawName(targetCtx, s: number, name: string): void {
		let buffer = this.sunwell.getBuffer(1024, 200);
		let ctx = buffer.getContext("2d");
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

		if (this.type === CardType.SPELL) {
			pathMiddle = .52;
			maxWidth = 580;
			c = [
				{x: 10, y: 100},
				{x: 212, y: 35},
				{x: 368, y: 35},
				{x: 570, y: 105}
			]
		}

		if (this.type === CardType.WEAPON) {
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
			ctx.font = fontSize + "px " + this.titleFont;
			textWidth = 0;
			for (let i = 0; i < name.length; i++) {
				textWidth += ctx.measureText(name[i]).width + 2;
			}

			textWidth *= 1.25;
		}

		textWidth = textWidth / maxWidth;
		var begin = pathMiddle - (textWidth / 2);
		var steps = textWidth / name.length;

		var p, t, leftPos = 0, m;
		for (let i = 0; i < name.length; i++) {
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

		this.sunwell.freeBuffer(buffer);
	}

	/**
	 * Renders a given number to the defined position.
	 * The x/y position should be the position on an unscaled card.
	 */
	public drawNumber(targetCtx, x: number, y: number, s: number, num: number, size: number, color: string): void {
		var buffer = this.sunwell.getBuffer();
		var bufferCtx = buffer.getContext("2d");

		buffer.width = 256;
		buffer.height = 256;

		let n = num.toString().split("");

		var tX = 10;

		bufferCtx.font = size + "px " + this.titleFont;

		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";

		bufferCtx.textAlign = "left";

		for (let i = 0; i < n.length; i++) {
			bufferCtx.lineWidth = 13;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(n[i], tX, 10);
			bufferCtx.strokeText(n[i], tX, 10);

			bufferCtx.fillStyle = color;
			bufferCtx.strokeStyle = color;
			bufferCtx.lineWidth = 2.5;
			bufferCtx.fillText(n[i], tX, 10);
			//ctx.strokeText(text[i], x, y);

			tX += bufferCtx.measureText(n[i]).width;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (x - (b.w / 2)) * s, (y - (b.h / 2)) * s, b.w * s, b.h * s);

		this.sunwell.freeBuffer(buffer);
	}

	public drawRaceText(targetCtx, s: number, raceText: string): void {
		let buffer = this.sunwell.getBuffer(300, 60);
		let bufferCtx = buffer.getContext("2d");
		let x = 10;
		let text = raceText.split("");

		bufferCtx.font = "45px " + this.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";
		bufferCtx.textAlign = "left";

		for (let i = 0; i < text.length; i++) {
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

		this.sunwell.freeBuffer(buffer);
	}

	public drawRarityGem(ctx, s: number, asset: string): void {
		let coords = [];

		switch(this.type) {
			case CardType.MINION:
				coords = [146, 146, 326, 607, 146, 146];
				break;
			case CardType.SPELL:
				coords = [149, 149, 311, 607, 150, 150];
				break;
			case CardType.WEAPON:
				coords = [149, 149, 311, 607, 150, 150];
				break;
		}
		ctx.drawImage(asset, 0, 0, coords[0], coords[1], coords[2] * s, coords[3] * s, coords[4] * s, coords[5] * s);
	}

	public drawStats(ctx, s: number): void {
		if ((this.type === CardType.MINION || this.type === CardType.WEAPON) && !this.hideStats) {
			this.drawNumber(ctx, 128, 994, s, this.attack, 150, this.attackColor);
			this.drawNumber(ctx, 668, 994, s, this.health, 150, this.healthColor);
		}
	}

	public drawWatermarkAsset(ctx, s, asset: string): void {
		ctx.globalCompositeOperation = "color-burn"; //?

		let a = 270;
		let b = 735;

		if (this.type === CardType.MINION && this.raceText) {
			a -= 12; // Shift up
		} else if (this.type === CardType.SPELL) {
			ctx.globalAlpha = 0.7;
			a = 264;
			b = 726;
		} else if (this.type === CardType.WEAPON) {
			ctx.globalCompositeOperation = "lighten";
			ctx.globalAlpha = 0.07;
			a = 264;
		}

		ctx.drawImage(asset, 0, 0, 128, 128, a * s, b * s, 256 * s, 256 * s);
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
	}
}
