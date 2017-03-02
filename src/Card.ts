import {Sunwell} from "./Sunwell";


function cleanEnum(val: string | number, e) {
	if (typeof val === "string") {
		if (val in e) {
			return e[val];
		} else {
			return e["INVALID"];
		}
	}
	return val || 0;
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
	ELEMENTAL = 18,
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
RaceNames[Race.ELEMENTAL] = {"enUS": "Elemental"};
RaceNames[Race.BEAST] = {"enUS": "Beast"};
RaceNames[Race.DEMON] = {"enUS": "Demon"};
RaceNames[Race.PIRATE] = {"enUS": "Pirate"};
RaceNames[Race.DRAGON] = {"enUS": "Dragon"};
RaceNames[Race.TOTEM] = {"enUS": "Totem"};


interface Coords {
	sx?: number,
	sy?: number,
	sWidth?: number,
	sHeight?: number,
	dx: number,
	dy: number,
	dWidth?: number,
	dHeight?: number,
	ratio?: number,
}


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
	public bodyTextColor: string;
	public costColor: string;
	public attackColor: string;
	public healthColor: string;
	public width: number;
	public key: number;

	private callback: Function;
	private cacheKey: number;
	private cardFrameAsset: string;
	private nameBannerAsset: string;
	private rarityGemAsset: string;
	private multiBannerAsset: string;
	private watermarkAsset: string;

	constructor(sunwell: Sunwell, props, width: number, canvas, target, callback?: Function) {
		this.sunwell = sunwell;

		if (!props) {
			throw new Error("No card properties given");
		}

		this.canvas = canvas;
		this.target = target;
		this.callback = callback;

		this.width = width;
		this.type = props.type;
		this.cost = props.cost || 0;
		this.attack = props.attack || 0;
		this.health = props.health || 0;
		this.costsHealth = props.costHealth || false;
		this.hideStats = props.hideStats;
		this.language = props.language || "enUS";
		this.name = props.name || "";

		this.multiClassGroup = cleanEnum(props.multiClassGroup, MultiClassGroup) as MultiClassGroup;
		this.cardClass = cleanEnum(props.playerClass, CardClass) as CardClass;
		this.set = cleanEnum(props.set, CardSet) as CardSet;
		this.type = cleanEnum(props.type, CardType) as CardType;
		this.race = cleanEnum(props.race, Race) as Race;
		this.rarity = cleanEnum(props.rarity, Rarity) as Rarity;

		this.cardFrameAsset = this.getCardFrameAsset();
		this.nameBannerAsset = this.getNameBannerAsset();
		this.rarityGemAsset = this.getRarityGemAsset();
		this.watermarkAsset = this.getWatermarkAsset();

		if (this.multiClassGroup) {
			let smulti = MultiClassGroup[this.multiClassGroup];
			this.multiBannerAsset = "multi-" + smulti.toLowerCase();
		}

		if (this.type === CardType.MINION) {
			this.elite = props.elite || false;
			this.raceText = props.raceText || this.getRaceText();
			this.silenced = props.silenced || false;
		}

		if (this.type === CardType.WEAPON && props.durability) {
			// Weapons alias health to durability
			this.health = props.durability;
		}

		this.costColor = getNumberStyle(props.costStyle);
		this.attackColor = getNumberStyle(props.costStyle);
		this.healthColor = getNumberStyle(props.healthStyle);
		this.bodyText = props.collectionText || props.text || "";
		this.bodyTextColor = (this.type === CardType.WEAPON ? "white" : "black");
		this.titleFont = sunwell.options.titleFont;
		this.texture = props.texture;

		this.cacheKey = this.checksum();
		this.key = props.key || this.cacheKey;
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
		var assetsToLoad: Array<string> = [
			this.cardFrameAsset, this.nameBannerAsset
		];

		if (this.costsHealth) {
			assetsToLoad.push("health");
		} else {
			assetsToLoad.push("cost-mana");
		}

		if (!this.hideStats) {
			if (this.type === CardType.MINION) {
				assetsToLoad.push("attack", "health");
			} else if (this.type === CardType.WEAPON) {
				assetsToLoad.push("attack-weapon", "health-weapon");
			}
		}

		if (this.elite) assetsToLoad.push("elite");
		if (this.raceText) assetsToLoad.push("race-banner");
		if (this.silenced) assetsToLoad.push("silence-x");
		if (this.multiBannerAsset) assetsToLoad.push(this.multiBannerAsset);
		if (this.rarityGemAsset) assetsToLoad.push(this.rarityGemAsset);
		if (this.watermarkAsset) assetsToLoad.push(this.watermarkAsset);

		return assetsToLoad;
	}

	public getCardArtTexture() {
		if (!this.texture) {
			this.sunwell.log("No card texture specified. Creating empty texture.");
			return this.sunwell.getBuffer(1024, 1024);
		} else if (this.texture instanceof this.sunwell.options.platform.Image) {
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

	private getCardFrameAsset(): string {
		let sclass = CardClass[this.cardClass || CardClass.NEUTRAL].toLowerCase();
		if (this.cardClass == CardClass.DREAM) sclass = "hunter";
		switch (this.type) {
			case CardType.MINION: return "frame-minion-" + sclass;
			case CardType.SPELL: return "frame-spell-" + sclass;
			case CardType.WEAPON: return "frame-weapon-" + sclass;
		}
		return "";
	}

	private getNameBannerAsset(): string {
		switch (this.type) {
			case CardType.MINION: return "name-banner-minion";
			case CardType.SPELL: return "name-banner-spell";
			case CardType.WEAPON: return "name-banner-weapon";
		}
		return "";
	}

	private getRarityGemAsset(): string {
		if (this.rarity == Rarity.INVALID || this.rarity == Rarity.FREE) {
			return "";
		}
		if (this.rarity == Rarity.COMMON && this.set == CardSet.CORE) {
			return "";
		}

		let srarity = Rarity[this.rarity].toLowerCase();
		switch (this.type) {
			case CardType.MINION: return "rarity-minion-" + srarity;
			case CardType.SPELL: return "rarity-spell-" + srarity;
			case CardType.WEAPON: return "rarity-weapon-" + srarity;
		}
		return "";
	}

	private getWatermarkAsset(): string {
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
		var cvs = this.canvas;

		var drawTimeout = setTimeout(() => {
			this.sunwell.error("Drawing timed out", this.name);
			this.sunwell.activeRenders--;
		}, this.sunwell.options.drawTimeout);

		ctx.save();
		ctx.clearRect(0, 0, cvs.width, cvs.height);

		// >>>>> Begin Skeleton drawing
		if (this.sunwell.renderCache[this.cacheKey]) {
			this.sunwell.log("Skipping skeleton draw");
			ctx.drawImage(this.sunwell.renderCache[this.cacheKey], 0, 0);
		} else {
			this.drawCardArt(ctx, s);

			this.drawImage(ctx, this.cardFrameAsset, {dx: 0, dy: 0, dWidth: cvs.width, dHeight: cvs.height});

			if (this.multiBannerAsset) {
				this.drawImage(ctx, this.multiBannerAsset, {dx: 17, dy: 88, ratio: s});
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
				this.drawImage(ctx, "cost-mana", {dx: 24, dy: 82, ratio: s});
			}

			if (this.rarityGemAsset) {
				this.drawRarityGem(ctx, s);
			}

			this.drawNameBanner(ctx, s);

			if (this.raceText) {
				this.drawImage(ctx, "race-banner", {dx: 125, dy: 937, ratio: s});
			}

			this.drawStatsTextures(ctx, s);

			if (this.elite) {
				this.drawImage(ctx, "elite", {dx: 196, dy: 0, dWidth: 529, ratio: s});
			}

			if (this.watermarkAsset) {
				this.drawWatermark(ctx, s);
			}

			if (this.sunwell.options.cacheSkeleton) {
				let cacheImage = new this.sunwell.options.platform.Image();
				cacheImage.src = cvs.toDataURL();
				this.sunwell.renderCache[this.cacheKey] = cacheImage;
			}
		}

		// <<<<<<<< Finished Skeleton drawing

		this.drawName(ctx, s, this.name);

		this.drawStats(ctx, s);

		if (this.raceText) {
			this.drawRaceText(ctx, s, this.raceText);
		}

		this.drawBodyText(ctx, s, false, this.bodyText);

		if (this.silenced) {
			this.drawImage(ctx, "silence-x", {dx: 200, dy: 660, ratio: s});
		}

		ctx.restore();
		clearTimeout(drawTimeout);

		if (this.callback) {
			this.callback(cvs);
		}

		if (this.target) {
			if (typeof this.target == "function") {
				this.target(cvs);
			} else {
				this.target.src = cvs.toDataURL();
			}
		}

		this.sunwell.activeRenders--;
	}

	private drawImage(ctx, assetKey: string, coords: Coords): void {
		let asset = this.sunwell.getAsset(assetKey);
		if (!asset) {
			this.sunwell.error("Not drawing asset", assetKey);
			return;
		}
		let ratio = coords.ratio || 1;
		let width = coords.sWidth || asset.width;
		let height = coords.sHeight || asset.height;
		ctx.drawImage(
			asset,
			coords.sx || 0, coords.sy || 0,
			width, height,
			coords.dx * ratio, coords.dy * ratio,
			(coords.dWidth || width) * ratio, (coords.dHeight || height) * ratio
		);
	}

	public drawCardArt(ctx, ratio: number) {
		let dx: number, dy: number, dWidth: number, dHeight: number;
		let t = this.getCardArtTexture();

		ctx.save();
		switch (this.type) {
			case CardType.MINION:
				dx = 100, dy = 75, dWidth = 590, dHeight = 590;
				drawEllipse(ctx, 180 * ratio, dy * ratio, 430 * ratio, dHeight * ratio);
				break;
			case CardType.SPELL:
				dx = 125, dy = 117, dWidth = 529, dHeight = 529;
				ctx.beginPath();
				ctx.rect(dx * ratio, 165 * ratio, dWidth * ratio, 434 * ratio);
				break;
			case CardType.WEAPON:
				dx = 150, dy = 135, dWidth = 476, dHeight = 476;
				drawEllipse(ctx, dx * ratio, dy * ratio, dWidth * ratio, 468 * ratio);
				break;
		}
		ctx.clip();
		ctx.fillStyle = "grey";
		ctx.fillRect(0, 0, 765 * ratio, 1100 * ratio);
		ctx.drawImage(t, 0, 0, t.width, t.height, dx * ratio, dy * ratio, dWidth * ratio, dHeight * ratio);
		ctx.restore();
	}

	public drawBodyText(targetCtx, s: number, forceSmallerFirstLine: boolean, text: string): void {
		var manualBreak = text.substr(0, 3) === "[x]";
		var bodyText = manualBreak ? text.substr(3) : text;
		if (!bodyText) {
			return;
		}

		var xPos = 0,
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

		var words = bodyText.replace(/[\$#_]/g, "").replace(/\n/g, " \n ").split(/ /g);

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

		bufferRowCtx.fillStyle = this.bodyTextColor;
		bufferRowCtx.textBaseline = this.sunwell.options.bodyBaseline;

			const getFontMaterial = () => {
			let font = this.sunwell.options.bodyFont;
			let prefix = "";
			if(typeof font === "function") {
				font = font(isBold > 0, isItalic > 0);
			}
			else {
				prefix = (isBold > 0 ? "bold " : "") + (isItalic > 0 ? "italic " : "");
			}
			const material = prefix + fontSize + "px" + this.sunwell.bodyFontSizeExtra + ' "' + font + '", sans-serif';
			return material;
		};
		bufferRowCtx.font = getFontMaterial();

		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			const cleanWord = word.trim().replace(/<((?!>).)*>/g, "");

			const width = bufferRowCtx.measureText(cleanWord).width;
			this.sunwell.log("Next word:", word);

			if (!manualBreak && (xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8)) && !justLineBreak) {
				this.sunwell.log((xPos + width), ">", bufferRow.width);
				this.sunwell.log("Calculated line break");
				smallerFirstLine = false;
				justLineBreak = true;
				lineCount++;
				[xPos, yPos] = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
			}

			const chars = word.split("");

			if (word === "\n") {
				this.sunwell.log("Manual line break");
				lineCount++;
				[xPos, yPos] = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
				justLineBreak = true;
				continue;
			}

			justLineBreak = false;

			for (let j = 0; j < chars.length; j++) {
				const char = chars[j];

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

				xPos += bufferRowCtx.measureText(char).width;
			}
			const em = bufferRowCtx.measureText("M").width;
			xPos += 0.275 * em;
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

		var maxWidth = 560;

		let pathMiddle = .55;
		let c = [
			{x: 0, y: 110},
			{x: 122, y: 140},
			{x: 368, y: 16},
			{x: 580, y: 100},
		];

		if (this.type === CardType.SPELL) {
			pathMiddle = .49;
			maxWidth = 560;
			c = [
				{x: 10, y: 97},
				{x: 212, y: 45},
				{x: 368, y: 45},
				{x: 570, y: 100},
			]
		}

		if (this.type === CardType.WEAPON) {
			pathMiddle = .56;
			maxWidth = 580;
			c = [
				{x: 10, y: 77},
				{x: 50, y: 77},
				{x: 500, y: 77},
				{x: 570, y: 77},
			]
		}

		if(this.sunwell.options.debug) {
			ctx.strokeStyle = "red";
			ctx.fillStyle = "red";
			for(let i in c) {
				ctx.fillRect(c[i].x - 2, c[i].y - 2, 4, 4);
			}
		}

		ctx.lineWidth = 13;
		ctx.strokeStyle = "black";

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		// calculate text width
		const getCharDimensions = () => {
			const dimensions = [];
			const em = ctx.measureText("M").width;
			for (let i = 0; i < name.length; i++) {
				ctx.save();
				const char = name[i];
				const scale = {x: 1, y: 1};
				let charWidth = ctx.measureText(char).width + 0.1 * em;
				switch (char) {
					case " ":
						charWidth = 0.2 * em;
						break;
					case "'": // see "Death's Bite"
						charWidth = 0.27 * em;
						scale.x = 0.5;
						scale.y = 1;
						break;
				}
				dimensions[i] = {
					width: charWidth,
					scale: scale,
				};
				ctx.restore();
			}
			return dimensions;
		};

		let dimensions = [];
		let fontSize = 55;
		do {
			fontSize -= 1;
			ctx.font = fontSize + "px " + this.titleFont;
		} while ((dimensions = getCharDimensions()).reduce((a, b) => a + b.width, 0) > maxWidth && fontSize > 10);

		let textWidth = dimensions.reduce((a, b) => a + b.width, 0);
		textWidth = textWidth / maxWidth;
		var begin = pathMiddle - (textWidth / 2);
		var steps = textWidth / name.length;

		// draw text
		var p, t, leftPos = 0;
		for (let i = 0; i < name.length; i++) {
			const char = name[i].trim();
			const dimension = dimensions[i];
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

			if(char.length) {

				ctx.save();
				ctx.translate(p.x, p.y);

				if(dimension.scale.x) {
					ctx.scale(dimension.scale.x, dimension.scale.y);
				}
				//ctx.setTransform(1.2, p.r, 0, 1, p.x, p.y);
				ctx.rotate(p.r);

				// shadow
				ctx.lineWidth = 10 * (fontSize / 50);
				ctx.strokeStyle = "black";
				ctx.fillStyle = "black";
				ctx.fillText(char, 0, 0);
				ctx.strokeText(char, 0, 0);

				// text
				ctx.fillStyle = "white";
				ctx.strokeStyle = "white";
				ctx.lineWidth = 2.5 * (fontSize / 50);
				ctx.fillText(char, 0, 0);

				ctx.restore();
			}

			leftPos += dimension.width;
		}

		let coords: Coords = {
			sx: 0, sy: 0,
			sWidth: 580, sHeight: 200,
			dx: (395 - (580 / 2)) * s,
			dy: (725 - 200) * s,
			dWidth: 580 * s, dHeight: 200 * s
		}
		targetCtx.drawImage(buffer, coords.sx, coords.sy, coords.sWidth, coords.sHeight, coords.dx, coords.dy, coords.dWidth, coords.dHeight);
		this.sunwell.freeBuffer(buffer);
	}

	public drawNameBanner(ctx, ratio: number) {
		let coords : Coords;
		switch (this.type) {
			case CardType.MINION:
				coords = {sWidth: 608, sHeight: 144, dx: 94, dy: 546, dWidth: 608, dHeight: 144};
				break
			case CardType.SPELL:
				coords = {sWidth: 646, sHeight: 199, dx: 66, dy: 530, dWidth: 646, dHeight: 199};
				break
			case CardType.WEAPON:
				coords = {sWidth: 660, sHeight: 140, dx: 56, dy: 551, dWidth: 660, dHeight: 140};
				break;
		}

		coords.ratio = ratio;
		this.drawImage(ctx, this.nameBannerAsset, coords);
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

		const xWidth = bufferCtx.measureText("x").width;
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
			x += xWidth * 0.1;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (394 - (b.w / 2)) * s, (1001 - (b.h / 2)) * s, b.w * s, b.h * s);

		this.sunwell.freeBuffer(buffer);
	}

	public drawRarityGem(ctx, ratio: number): void {
		let dx: number, dy: number;

		switch(this.type) {
			case CardType.MINION:
				dx = 326, dy = 607;
				break;
			case CardType.SPELL:
				dx = 311, dy = 607;
				break;
			case CardType.WEAPON:
				dx = 311, dy = 607;
				break;
		}
		this.drawImage(ctx, this.rarityGemAsset, {dx: dx, dy: dy, ratio: ratio});
	}

	public drawStats(ctx, s: number): void {
		if (!this.hideStats) {
			this.drawNumber(ctx, 116, 170, s, this.cost, 175, this.costColor);

			if (this.type === CardType.MINION || this.type === CardType.WEAPON) {
				const attackX = this.type === CardType.MINION ? 128 : 118;
				this.drawNumber(ctx, attackX, 994, s, this.attack, 160, this.attackColor);
				this.drawNumber(ctx, 668, 994, s, this.health, 160, this.healthColor);
			}
		}
	}

	public drawStatsTextures(ctx, s: number): void {
		if (!this.hideStats) {
			switch (this.type) {
				case CardType.MINION:
					this.drawImage(
						ctx, "attack",
						{sWidth: 214, sHeight: 238, dx: 0, dy: 862, dWidth: 214, dHeight: 238, ratio: s}
					)
					this.drawImage(
						ctx, "health",
						{sWidth: 167, sHeight: 218, dx: 575, dy: 876, dWidth: 167, dHeight: 218, ratio: s}
					)
					break;
				case CardType.WEAPON:
					this.drawImage(
						ctx, "attack-weapon",
						{sWidth: 312, sHeight: 306, dx: 32, dy: 906, dWidth: 187, dHeight: 183, ratio: s}
					)
					this.drawImage(
						ctx, "health-weapon",
						{sWidth: 301, sHeight: 333, dx: 584, dy: 890, dWidth: 186, dHeight: 205, ratio: s}
					)
					break;
			}
		}
	}

	public drawWatermark(ctx, s: number): void {
		let dx = 270;
		let dy = 735;

		ctx.globalCompositeOperation = "multiply";

		if (this.type === CardType.MINION) {
			if(this.raceText) {
				dy -= 10; // Shift up
			}
			ctx.globalAlpha = 0.6;
		} else if (this.type === CardType.SPELL) {
			ctx.globalAlpha = 0.7;
			dx = 264;
			dy = 726;
		} else if (this.type === CardType.WEAPON) {
			ctx.globalCompositeOperation = "lighten";
			ctx.globalAlpha = 0.1;
			dx = 264;
		}

		this.drawImage(ctx, this.watermarkAsset, {dx: dx, dy: dy, dWidth: 256, dHeight: 256, ratio: s});

		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
	}
}
