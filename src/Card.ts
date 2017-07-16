import Sunwell from "./Sunwell";
import {CardClass, CardSet, CardType, MultiClassGroup, Race, Rarity} from "./Enums";

function cleanEnum(val: string | number, e) {
	if (typeof val === "string") {
		if (val in e) {
			return e[val];
		} else {
			return e.INVALID;
		}
	}
	return val || 0;
}

/**
 * Helper function to draw the oval mask for the cards artwork.
 */
function drawEllipse(ctx, x: number, y: number, w: number, h: number): void {
	const kappa = 0.5522848;
	const ox = w / 2 * kappa; // control point offset horizontal
	const oy = h / 2 * kappa; // control point offset vertical
	const xe = x + w; // x-end
	const ye = y + h; // y-end
	const xm = x + w / 2; // x-middle
	const ym = y + h / 2; // y-middle

	ctx.beginPath();
	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	// ctx.closePath(); // not used correctly, see comments (use to close off open path)
	ctx.stroke();
}

/**
 * Get the bounding box of a canvas content.
 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
 */
function contextBoundingBox(ctx) {
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;
	const data = ctx.getImageData(0, 0, w, h).data;
	let minX = 999;
	let minY = 999;
	let maxX = 0;
	let maxY = 0;

	let out = false;

	for (let y = h - 1; y > -1; y--) {
		if (out) {
			break;
		}
		for (let x = 0; x < w; x++) {
			if (data[y * (w * 4) + x * 4 + 3] > 0) {
				maxY = Math.max(maxY, y);
				out = true;
				break;
			}
		}
	}

	if (maxY === undefined) {
		return null;
	}

	out2: for (let x = w - 1; x > -1; x--) {
		for (let y = 0; y < h; y++) {
			if (data[y * (w * 4) + x * 4 + 3] > 0) {
				maxX = Math.max(maxX, x);
				break out2;
			}
		}
	}

	out3: for (let x = 0; x < maxX; x++) {
		for (let y = 0; y < h; y++) {
			if (data[y * (w * 4) + x * 4 + 3] > 0) {
				minX = Math.min(x, minX);
				break out3;
			}
		}
	}

	out4: for (let y = 0; y < maxY; y++) {
		for (let x = 0; x < w; x++) {
			if (data[y * (w * 4) + x * 4 + 3] > 0) {
				minY = Math.min(minY, y);
				break out4;
			}
		}
	}

	return {
		x: minX,
		y: minY,
		maxX: maxX,
		maxY: maxY,
		w: maxX - minX,
		h: maxY - minY,
	};
}

function getNumberStyle(style: string) {
	switch (style) {
		case "-":
			return "#f00";
		case "+":
			return "#0f0";
		default:
			return "white";
	}
}

/**
 * Finishes a text line and starts a new one.
 */
function finishLine(
	bufferTextCtx,
	bufferRow,
	bufferRowCtx,
	xPos: number,
	yPos: number,
	totalWidth: number
): [number, number] {
	let xCalc = totalWidth / 2 - xPos / 2;

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
	const rX =
		3 * Math.pow(1 - t, 2) * (curve[1].x - curve[0].x) +
		6 * (1 - t) * t * (curve[2].x - curve[1].x) +
		3 * Math.pow(t, 2) * (curve[3].x - curve[2].x);
	const rY =
		3 * Math.pow(1 - t, 2) * (curve[1].y - curve[0].y) +
		6 * (1 - t) * t * (curve[2].y - curve[1].y) +
		3 * Math.pow(t, 2) * (curve[3].y - curve[2].y);

	const x =
		Math.pow(1 - t, 3) * curve[0].x +
		3 * Math.pow(1 - t, 2) * t * curve[1].x +
		3 * (1 - t) * Math.pow(t, 2) * curve[2].x +
		Math.pow(t, 3) * curve[3].x;
	const y =
		Math.pow(1 - t, 3) * curve[0].y +
		3 * Math.pow(1 - t, 2) * t * curve[1].y +
		3 * (1 - t) * Math.pow(t, 2) * curve[2].y +
		Math.pow(t, 3) * curve[3].y;

	return {x: x, y: y, r: Math.atan2(rY, rX)};
}

const RaceNames = {};
RaceNames[Race.MURLOC] = {enUS: "Murloc"};
RaceNames[Race.MECHANICAL] = {enUS: "Mech"};
RaceNames[Race.ELEMENTAL] = {enUS: "Elemental"};
RaceNames[Race.BEAST] = {enUS: "Beast"};
RaceNames[Race.DEMON] = {enUS: "Demon"};
RaceNames[Race.PIRATE] = {enUS: "Pirate"};
RaceNames[Race.DRAGON] = {enUS: "Dragon"};
RaceNames[Race.TOTEM] = {enUS: "Totem"};

interface ICoords {
	sx?: number;
	sy?: number;
	sWidth?: number;
	sHeight?: number;
	dx: number;
	dy: number;
	dWidth?: number;
	dHeight?: number;
	ratio?: number;
}

export default abstract class Card {
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
	private rarityGemAsset: string;
	private multiBannerAsset: string;
	private nameBannerAsset: string;
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
		this.cardClass = cleanEnum(props.cardClass, CardClass) as CardClass;
		this.set = cleanEnum(props.set, CardSet) as CardSet;
		this.type = cleanEnum(props.type, CardType) as CardType;
		this.race = cleanEnum(props.race, Race) as Race;
		this.rarity = cleanEnum(props.rarity, Rarity) as Rarity;

		this.cardFrameAsset = this.getCardFrameAsset(this.getCardFrameClass());
		this.rarityGemAsset = this.getRarityGemAsset(this.getRarityGem());
		this.nameBannerAsset = this.getNameBannerAsset();
		this.watermarkAsset = this.getWatermarkAsset();

		if (this.multiClassGroup) {
			const smulti = MultiClassGroup[this.multiClassGroup];
			this.multiBannerAsset = "multi-" + smulti.toLowerCase();
		}

		if (this.type === CardType.MINION) {
			this.raceText = props.raceText || this.getRaceText();
			this.silenced = props.silenced || false;
		}

		if (this.type === CardType.WEAPON && props.durability) {
			// Weapons alias health to durability
			this.health = props.durability;
		}

		this.elite = props.elite || false;
		this.costColor = getNumberStyle(props.costStyle);
		this.attackColor = getNumberStyle(props.costStyle);
		this.healthColor = getNumberStyle(props.healthStyle);
		this.bodyText = props.collectionText || props.text || "";
		this.bodyTextColor = this.type === CardType.WEAPON ? "white" : "black";
		this.titleFont = sunwell.options.titleFont;
		this.texture = props.texture;

		this.cacheKey = this.checksum(props);
		this.key = props.key || this.cacheKey;
		sunwell.prepareRenderingCard(this);
	}

	public abstract getCardFrameAsset(cardClass: CardClass): string;
	public abstract getRarityGemAsset(rarity: Rarity): string;
	public abstract rarityGemCoords: ICoords;
	public abstract getNameBannerAsset(): string;
	public abstract getNameBannerCoords(): ICoords;
	public abstract getWatermarkCoords(): ICoords;

	private checksum(props): number {
		const s = JSON.stringify(props) + this.width;
		const length = s.length;
		let chk = 0;
		for (let i = 0; i < length; i++) {
			const char = s.charCodeAt(i);
			chk = (chk << 5) - chk + char;
			chk |= 0;
		}

		return chk;
	}

	public getAssetsToLoad(): string[] {
		const assetsToLoad: string[] = [this.cardFrameAsset, this.nameBannerAsset];

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

		if (this.elite) {
			if (this.type === CardType.SPELL) {
				assetsToLoad.push("elite-spell");
			} else {
				assetsToLoad.push("elite");
			}
		}
		if (this.raceText) {
			assetsToLoad.push("race-banner");
		}
		if (this.silenced) {
			assetsToLoad.push("silence-x");
		}
		if (this.multiBannerAsset) {
			assetsToLoad.push(this.multiBannerAsset);
		}
		if (this.rarityGemAsset) {
			assetsToLoad.push(this.rarityGemAsset);
		}
		if (this.watermarkAsset) {
			assetsToLoad.push(this.watermarkAsset);
		}

		return assetsToLoad;
	}

	public getCardArtTexture(): any {
		if (!this.texture) {
			this.sunwell.log("No card texture specified. Creating empty texture.");
			return this.sunwell.getBuffer(1024, 1024);
		} else if (this.texture instanceof this.sunwell.options.platform.Image) {
			return this.texture;
		} else if (typeof this.texture === "string") {
			return this.sunwell.assets[this.texture];
		} else {
			const t = this.sunwell.getBuffer(this.texture.crop.w, this.texture.crop.h);
			const tCtx = t.getContext("2d");
			tCtx.drawImage(
				this.texture.image,
				this.texture.crop.x,
				this.texture.crop.y,
				this.texture.crop.w,
				this.texture.crop.h,
				0,
				0,
				t.width,
				t.height
			);
			return t;
		}
	}

	public getRaceText(): string {
		if (this.race && this.type === CardType.MINION && this.race in RaceNames) {
			return RaceNames[this.race][this.language];
		}
		return "";
	}

	private getCardFrameClass(): CardClass {
		switch (this.cardClass) {
			case CardClass.DREAM:
				return CardClass.HUNTER;
			case CardClass.INVALID:
				return CardClass.NEUTRAL;
			default:
				return this.cardClass;
		}
	}

	private getRarityGem(): Rarity {
		if (this.rarity === Rarity.INVALID) {
			return Rarity.FREE;
		} else if (this.rarity === Rarity.COMMON && this.set === CardSet.CORE) {
			return Rarity.FREE;
		}

		return this.rarity;
	}

	private getWatermarkAsset(): string {
		switch (this.set) {
			case CardSet.EXPERT1:
				return "set-classic";
			case CardSet.NAXX:
				return "set-naxx";
			case CardSet.GVG:
				return "set-gvg";
			case CardSet.BRM:
				return "set-brm";
			case CardSet.TGT:
				return "set-tgt";
			case CardSet.LOE:
				return "set-loe";
			case CardSet.OG:
				return "set-og";
			case CardSet.KARA:
				return "set-kara";
			case CardSet.GANGS:
				return "set-gangs";
			case CardSet.UNGORO:
				return "set-ungoro";
			case CardSet.HOF:
				return "set-hof";
		}
		return "";
	}

	public draw(ctx, s: number): void {
		const cvs = this.canvas;

		const drawTimeout = setTimeout(() => {
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

			this.drawImage(ctx, this.cardFrameAsset, {
				dx: 0,
				dy: 0,
				dWidth: cvs.width,
				dHeight: cvs.height,
			});

			if (this.multiBannerAsset) {
				this.drawImage(ctx, this.multiBannerAsset, {
					dx: 17,
					dy: 88,
					ratio: s,
				});
			}

			if (this.costsHealth) {
				ctx.drawImage(this.sunwell.getAsset("health"), 0, 0, 167, 218, 24 * s, 62 * s, 167 * s, 218 * s);
				ctx.save();
				ctx.shadowBlur = 50 * s;
				ctx.shadowColor = "#FF7275";
				ctx.shadowOffsetX = 1000;
				ctx.globalAlpha = 0.5;
				ctx.drawImage(
					this.sunwell.getAsset("health"),
					0,
					0,
					167,
					218,
					24 * s - 1000,
					62 * s,
					167 * s,
					218 * s
				);
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

			this.drawAttackTexture(ctx, s);
			this.drawHealthTexture(ctx, s);

			if (this.elite) {
				if (this.type === CardType.SPELL) {
					this.drawImage(ctx, "elite-spell", {
						dx: 201,
						dy: 70,
						dWidth: 601,
						ratio: s,
					});
				} else {
					this.drawImage(ctx, "elite", {
						dx: 196,
						dy: 0,
						dWidth: 529,
						ratio: s,
					});
				}
			}

			if (this.watermarkAsset) {
				this.drawWatermark(ctx, s);
			}

			if (this.sunwell.options.cacheSkeleton) {
				const cacheImage = new this.sunwell.options.platform.Image();
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
			if (typeof this.target === "function") {
				this.target(cvs);
			} else {
				this.target.src = cvs.toDataURL();
			}
		}

		this.sunwell.activeRenders--;
	}

	private drawImage(ctx, assetKey: string, coords: ICoords): void {
		const asset = this.sunwell.getAsset(assetKey);
		if (!asset) {
			this.sunwell.error("Not drawing asset", assetKey);
			return;
		}
		const ratio = coords.ratio || 1;
		const width = coords.sWidth || asset.width;
		const height = coords.sHeight || asset.height;
		ctx.drawImage(
			asset,
			coords.sx || 0,
			coords.sy || 0,
			width,
			height,
			coords.dx * ratio,
			coords.dy * ratio,
			(coords.dWidth || width) * ratio,
			(coords.dHeight || height) * ratio
		);
	}

	public drawCardArt(ctx, ratio: number) {
		let dx: number;
		let dy: number;
		let dWidth: number;
		let dHeight: number;
		const t = this.getCardArtTexture();

		ctx.save();
		switch (this.type) {
			case CardType.HERO:
			case CardType.MINION:
				(dx = 100), (dy = 75), (dWidth = 590), (dHeight = 590);
				drawEllipse(ctx, 180 * ratio, dy * ratio, 430 * ratio, dHeight * ratio);
				break;
			case CardType.SPELL:
				(dx = 125), (dy = 117), (dWidth = 529), (dHeight = 529);
				ctx.beginPath();
				ctx.rect(dx * ratio, 165 * ratio, dWidth * ratio, 434 * ratio);
				break;
			case CardType.WEAPON:
				(dx = 150), (dy = 135), (dWidth = 476), (dHeight = 476);
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
		const manualBreak = text.substr(0, 3) === "[x]";
		let bodyText = manualBreak ? text.substr(3) : text;
		if (!bodyText) {
			return;
		}

		const pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g;
		let xPos = 0;
		let yPos = 0;
		let isItalic = 0;
		let isBold = 0;
		let lineCount = 0;
		let justLineBreak;
		let plurals;
		let pBodyText;

		pBodyText = bodyText;
		while ((plurals = pluralRegex.exec(bodyText)) !== null) {
			pBodyText = pBodyText.replace(
				plurals[0],
				plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4])
			);
		}
		bodyText = pBodyText;
		this.sunwell.log("Rendering body", bodyText);

		const centerLeft = 390;
		const centerTop = 860;
		const words = bodyText.replace(/[\$#_]/g, "").replace(/\n/g, " \n ").replace(/ +/g, " ").split(/ /g);

		const bufferText = this.sunwell.getBuffer();
		const bufferTextCtx = bufferText.getContext("2d");

		const bufferRow = this.sunwell.getBuffer();
		const bufferRowCtx = bufferRow.getContext("2d");

		switch (this.type) {
			case CardType.HERO:
				bufferText.width = 490;
				bufferText.height = 290;
				bufferRow.width = 490;
				break;
			case CardType.MINION:
				bufferText.width = 520;
				bufferText.height = 290;
				bufferRow.width = 520;
				break;
			case CardType.SPELL:
				bufferText.width = 460;
				bufferText.height = 290;
				bufferRow.width = 460;
				break;
			case CardType.WEAPON:
				bufferText.width = 470;
				bufferText.height = 250;
				bufferRow.width = 470;
				break;
		}

		let fontSize = this.sunwell.options.bodyFontSize;
		let lineHeight = this.sunwell.options.bodyLineHeight;
		const totalLength = bodyText.replace(/<\/*.>/g, "").length;
		let smallerFirstLine = false;

		const cleanText = bodyText.replace(/<\/*.>/g, "");
		this.sunwell.log("counting length of " + cleanText);
		this.sunwell.log("Length is " + totalLength);

		bufferRowCtx.fillStyle = this.bodyTextColor;
		bufferRowCtx.textBaseline = this.sunwell.options.bodyBaseline;

		if (manualBreak) {
			let maxWidth = 0;
			bufferRowCtx.font = this.getFontMaterial(fontSize, false, false);
			bodyText.split("\n").forEach((line: string) => {
				const width = this.getLineWidth(bufferRowCtx, fontSize, line);
				if (width > maxWidth) {
					maxWidth = width;
				}
			});
			if (maxWidth > bufferText.width) {
				const ratio = bufferText.width / maxWidth;
				fontSize *= ratio;
				lineHeight *= ratio;
			}
		} else {
			if (totalLength >= 65) {
				fontSize = this.sunwell.options.bodyFontSize * 0.95;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.95;
			}

			if (totalLength >= 80) {
				fontSize = this.sunwell.options.bodyFontSize * 0.9;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.9;
			}

			if (totalLength >= 100) {
				fontSize = this.sunwell.options.bodyFontSize * 0.8;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.8;
			}
		}

		const getFontMaterial = () => this.getFontMaterial(fontSize, isBold > 0, isItalic > 0);
		bufferRowCtx.font = getFontMaterial();

		bufferRow.height = lineHeight;

		if (forceSmallerFirstLine || (totalLength >= 75 && this.type === CardType.SPELL)) {
			smallerFirstLine = true;
		}

		for (const word of words) {
			const cleanWord = word.trim().replace(/<((?!>).)*>/g, "");

			const width = bufferRowCtx.measureText(cleanWord).width;
			this.sunwell.log("Next word:", word);

			if (
				!manualBreak &&
				(xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8)) &&
				!justLineBreak
			) {
				this.sunwell.log(xPos + width, ">", bufferRow.width);
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
				smallerFirstLine = false;
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

				bufferRowCtx.fillText(
					char,
					xPos + this.sunwell.options.bodyFontOffset.x,
					this.sunwell.options.bodyFontOffset.y
				);

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

		const b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		targetCtx.drawImage(
			bufferText,
			b.x,
			b.y - 2,
			b.w,
			b.h,
			(centerLeft - b.w / 2) * s,
			(centerTop - b.h / 2) * s,
			b.w * s,
			(b.h + 2) * s
		);

		this.sunwell.freeBuffer(bufferText);
	}

	protected getFontMaterial(fontSize: number, bold: boolean, italic: boolean): string {
		let font = this.sunwell.options.bodyFont;
		let prefix = "";
		if (typeof font === "function") {
			font = font(bold, italic);
		} else {
			prefix = (bold ? "bold " : "") + (italic ? "italic " : "");
		}
		const material =
			prefix + fontSize + "px" + this.sunwell.bodyFontSizeExtra + ' "' + font + '", sans-serif';
		return material;
	}

	protected getLineWidth(context, fontSize, line: string): number {
		const words = line.split(" ");

		let width = 0;
		let isBold = 0;
		let isItalic = 0;
		const getFontMaterial = () => this.getFontMaterial(fontSize, isBold > 0, isItalic > 0);
		for (const word of words) {
			const chars = word.split("");

			for (let j = 0; j < chars.length; j++) {
				const char = chars[j];

				// <b>
				if (char === "<" && chars[j + 1] === "b" && chars[j + 2] === ">") {
					isBold++;
					j += 2;
					context.font = getFontMaterial();
					continue;
				}

				// </b>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "b" && chars[j + 3] === ">") {
					isBold--;
					j += 3;
					context.font = getFontMaterial();
					continue;
				}

				// <i>
				if (char === "<" && chars[j + 1] === "i" && chars[j + 2] === ">") {
					isItalic++;
					j += 2;
					context.font = getFontMaterial();
					continue;
				}

				// </i>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "i" && chars[j + 3] === ">") {
					isItalic--;
					j += 3;
					context.font = getFontMaterial();
					continue;
				}

				context.fillText(
					char,
					width + this.sunwell.options.bodyFontOffset.x,
					this.sunwell.options.bodyFontOffset.y
				);

				width += context.measureText(char).width;
			}
			const em = context.measureText("M").width;
			width += 0.275 * em;
		}

		return width;
	}

	public drawName(targetCtx, s: number, name: string): void {
		const buffer = this.sunwell.getBuffer(1024, 200);
		const ctx = buffer.getContext("2d");
		let maxWidth: number;
		let pathMiddle: number;
		let c: Array<{x: number; y: number}>;
		ctx.save();

		switch (this.type) {
			case CardType.HERO:
				pathMiddle = 0.56;
				maxWidth = 520;
				c = [{x: 0, y: 135}, {x: 220, y: 42}, {x: 350, y: 42}, {x: 570, y: 125}];
				break;
			case CardType.MINION:
				pathMiddle = 0.55;
				maxWidth = 560;
				c = [{x: 0, y: 110}, {x: 122, y: 140}, {x: 368, y: 16}, {x: 580, y: 100}];
				break;
			case CardType.SPELL:
				pathMiddle = 0.49;
				maxWidth = 560;
				c = [{x: 10, y: 97}, {x: 212, y: 45}, {x: 368, y: 45}, {x: 570, y: 100}];
				break;
			case CardType.WEAPON:
				pathMiddle = 0.56;
				maxWidth = 580;
				c = [{x: 10, y: 77}, {x: 50, y: 77}, {x: 500, y: 77}, {x: 570, y: 77}];
				break;
		}

		if (this.sunwell.options.debug) {
			ctx.strokeStyle = "red";
			ctx.fillStyle = "red";
			for (const coord of c) {
				ctx.fillRect(coord.x - 2, coord.y - 2, 4, 4);
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
			const dimensions_ = [];
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
				dimensions_[i] = {
					width: charWidth,
					scale: scale,
				};
				ctx.restore();
			}
			return dimensions_;
		};

		let dimensions = [];
		let fontSize = 55;
		do {
			fontSize -= 1;
			ctx.font = fontSize + "px " + this.titleFont;
		} while ((dimensions = getCharDimensions()).reduce((a, b) => a + b.width, 0) > maxWidth && fontSize > 10);

		const textWidth = dimensions.reduce((a, b) => a + b.width, 0) / maxWidth;
		const begin = pathMiddle - textWidth / 2;
		const steps = textWidth / name.length;

		// draw text
		let p,
			t,
			leftPos = 0;
		for (let i = 0; i < name.length; i++) {
			const char = name[i].trim();
			const dimension = dimensions[i];
			if (leftPos === 0) {
				t = begin + steps * i;
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

			if (char.length) {
				ctx.save();
				ctx.translate(p.x, p.y);

				if (dimension.scale.x) {
					ctx.scale(dimension.scale.x, dimension.scale.y);
				}
				// ctx.setTransform(1.2, p.r, 0, 1, p.x, p.y);
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

		const coords: ICoords = {
			sx: 0,
			sy: 0,
			sWidth: 580,
			sHeight: 200,
			dx: (395 - 580 / 2) * s,
			dy: (725 - 200) * s,
			dWidth: 580 * s,
			dHeight: 200 * s,
		};
		targetCtx.drawImage(
			buffer,
			coords.sx,
			coords.sy,
			coords.sWidth,
			coords.sHeight,
			coords.dx,
			coords.dy,
			coords.dWidth,
			coords.dHeight
		);
		this.sunwell.freeBuffer(buffer);
	}

	public drawNameBanner(ctx, ratio: number) {
		const coords = this.getNameBannerCoords();
		coords.ratio = ratio;
		this.drawImage(ctx, this.nameBannerAsset, coords);
	}

	/**
	 * Renders a given number to the defined position.
	 * The x/y position should be the position on an unscaled card.
	 */
	public drawNumber(
		targetCtx,
		x: number,
		y: number,
		s: number,
		num: number,
		size: number,
		color: string
	): void {
		const buffer = this.sunwell.getBuffer(256, 256);
		const bufferCtx = buffer.getContext("2d");
		const n = num.toString().split("");
		let tX = 10;

		bufferCtx.font = size + "px " + this.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textAlign = "left";
		bufferCtx.textBaseline = "hanging";

		for (const cnum of n) {
			bufferCtx.lineWidth = 13;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(cnum, tX, 10);
			bufferCtx.strokeText(cnum, tX, 10);

			bufferCtx.fillStyle = color;
			bufferCtx.strokeStyle = color;
			bufferCtx.lineWidth = 2.5;
			bufferCtx.fillText(cnum, tX, 10);
			// ctx.strokeText(cnum, x, y);

			tX += bufferCtx.measureText(cnum).width;
		}

		const b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (x - b.w / 2) * s, (y - b.h / 2) * s, b.w * s, b.h * s);

		this.sunwell.freeBuffer(buffer);
	}

	public drawRaceText(targetCtx, s: number, raceText: string): void {
		const buffer = this.sunwell.getBuffer(300, 60);
		const bufferCtx = buffer.getContext("2d");
		let x = 10;
		const text = raceText.split("");

		bufferCtx.font = "45px " + this.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";
		bufferCtx.textAlign = "left";

		const xWidth = bufferCtx.measureText("x").width;
		for (const char of text) {
			bufferCtx.lineWidth = 8;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(char, x, 10);
			bufferCtx.strokeText(char, x, 10);

			bufferCtx.fillStyle = "white";
			bufferCtx.strokeStyle = "white";
			bufferCtx.lineWidth = 1;
			bufferCtx.fillText(char, x, 10);
			// ctx.strokeText(char, x, y);

			x += bufferCtx.measureText(char).width;
			x += xWidth * 0.1;
		}

		const b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(
			buffer,
			b.x,
			b.y,
			b.w,
			b.h,
			(394 - b.w / 2) * s,
			(1001 - b.h / 2) * s,
			b.w * s,
			b.h * s
		);

		this.sunwell.freeBuffer(buffer);
	}

	public drawRarityGem(ctx, ratio: number): void {
		const coords = this.rarityGemCoords;
		coords.ratio = ratio;
		this.drawImage(ctx, this.rarityGemAsset, coords);
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

	public drawAttackTexture(ctx, s: number): void {
		if (this.hideStats) {
			return;
		}

		switch (this.type) {
			case CardType.MINION:
				this.drawImage(ctx, "health", {
					sWidth: 167,
					sHeight: 218,
					dx: 575,
					dy: 876,
					dWidth: 167,
					dHeight: 218,
					ratio: s,
				});
				break;
			case CardType.WEAPON:
				this.drawImage(ctx, "health-weapon", {
					sWidth: 301,
					sHeight: 333,
					dx: 584,
					dy: 890,
					dWidth: 186,
					dHeight: 205,
					ratio: s,
				});
				break;
		}
	}

	public drawHealthTexture(ctx, s: number): void {
		if (this.hideStats) {
			return;
		}

		switch (this.type) {
			case CardType.MINION:
				this.drawImage(ctx, "attack", {
					sWidth: 214,
					sHeight: 238,
					dx: 0,
					dy: 862,
					dWidth: 214,
					dHeight: 238,
					ratio: s,
				});
				break;
			case CardType.WEAPON:
				this.drawImage(ctx, "attack-weapon", {
					sWidth: 312,
					sHeight: 306,
					dx: 32,
					dy: 906,
					dWidth: 187,
					dHeight: 183,
					ratio: s,
				});
				break;
		}
	}

	public drawWatermark(ctx, s: number): void {
		const coords = this.getWatermarkCoords();
		coords.ratio = s;

		if (this.type === CardType.MINION || this.type === CardType.HERO) {
			ctx.globalCompositeOperation = "multiply";
			ctx.globalAlpha = 0.6;
		} else if (this.type === CardType.SPELL) {
			ctx.globalCompositeOperation = "multiply";
			ctx.globalAlpha = 0.7;
		} else if (this.type === CardType.WEAPON) {
			ctx.globalCompositeOperation = "lighten";
			ctx.globalAlpha = 0.1;
		}

		this.drawImage(ctx, this.watermarkAsset, coords);

		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
	}
}
