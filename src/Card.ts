import {CardClass, CardSet, CardType, MultiClassGroup, Race, Rarity} from "./Enums";
import Sunwell from "./Sunwell";

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
function drawHalfEllipse(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number
): void {
	const kappa = 0.5522848;
	const ox = w / 2 * kappa; // control point offset horizontal
	const oy = h / 2 * kappa; // control point offset vertical
	const xe = x + w; // x-end
	const ye = y + h; // y-end
	const xm = x + w / 2; // x-middle
	const ym = y + h / 2; // y-middle

	context.beginPath();
	context.moveTo(x, ym);
	context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	// The following two lines complete the bottom half of the ellipse.
	// We don't need to do that though, because the bottom half is hidden by
	// the card frame on minion cards. On Hero cards however, we actually do
	// need that full bottom half, so we keep that half square.
	// context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	// context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	context.lineTo(xe, ye);
	context.lineTo(x, ye);
	context.stroke();
}

/**
 * Helper function to draw a polygon from a list of points.
 */
function drawPolygon(
	context: CanvasRenderingContext2D,
	points: IPoint[],
	ratio: number
): void {
	if (points.length < 3) {
		return;
	}
	context.beginPath();
	// move to start point
	context.moveTo(points[0].x * ratio, points[0].y * ratio);
	// draw the lines starting at index 1
	points.slice(1).forEach(pt => {
		context.lineTo(pt.x * ratio, pt.y * ratio);
	});
	context.closePath();
	context.stroke();
}

/**
 * Get the bounding box of a canvas content.
 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
 */
function contextBoundingBox(context: CanvasRenderingContext2D) {
	const w = context.canvas.width;
	const h = context.canvas.height;
	const data = context.getImageData(0, 0, w, h).data;
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
	bufferTextCtx: CanvasRenderingContext2D,
	bufferRow: HTMLCanvasElement,
	bufferRowCtx: CanvasRenderingContext2D,
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
 * Parses the beginning of a string, looking for a bold or italic tag.
 */
function parseNextToken(s: string): {token: string; bold: number; italic: number} {
	let token: string;
	if (s[1] === "/") {
		token = s.slice(0, 4);
		if (token === "</b>") {
			return {token: token, bold: -1, italic: 0};
		} else if (token === "</i>") {
			return {token: token, bold: 0, italic: -1};
		}
	} else {
		token = s.slice(0, 3);
		if (token === "<b>") {
			return {token: token, bold: 1, italic: 0};
		} else if (token === "<i>") {
			return {token: token, bold: 0, italic: -1};
		}
	}

	return {token: "", bold: 0, italic: 0};
}

interface IPoint {
	x: number;
	y: number;
	r?: number;
}

/**
 * Given a curve and t, the function returns the point on the curve.
 * r is the rotation of the point in radians.
 * @returns {{x: (number|*), y: (number|*), r: number}}
 */
function getPointOnCurve(curve: IPoint[], t: number): IPoint {
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

const ReferenceWidth = 670;
const ReferenceHeight = 1000;

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
	public target;
	public texture;
	public canvas: HTMLCanvasElement;
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
	public key: number;
	public opposing: boolean;
	public costTextCoords: IPoint;
	public abstract baseCardFrameAsset: string;
	public abstract baseCardFrameCoords: ICoords;
	public abstract baseRarityGemAsset: string;
	public abstract rarityGemCoords: ICoords;
	public abstract bodyTextColor: string;
	public abstract nameBannerAsset: string;
	public abstract dragonAsset: string;
	public abstract dragonCoords: ICoords;
	public abstract attackGemAsset: string;
	public abstract attackGemCoords: ICoords;
	public abstract attackTextCoords: IPoint;
	public abstract healthTextCoords: IPoint;
	public abstract healthGemAsset: string;
	public abstract healthGemCoords: ICoords;
	public abstract nameBannerCoords: ICoords;
	public abstract bodyTextCoords: ICoords;
	public abstract nameTextCurve: {pathMiddle: number; maxWidth: number; curve: IPoint[]};
	public abstract artClipPolygon: IPoint[];
	public abstract artCoords: ICoords;
	public abstract cardFoundationAsset: string;
	public abstract cardFoundationCoords: ICoords;
	public abstract raceBannerAsset: string;
	public abstract raceBannerCoords: ICoords;
	public abstract raceTextCoords: ICoords;
	public abstract premium: boolean;

	private callback: (HTMLCanvasElement) => void;
	private cacheKey: number;
	private cardFrameAsset: string;
	private costGemAsset: string;
	private rarityGemAsset: string;
	private multiBannerAsset: string;
	private watermarkAsset: string;
	private propsJson: string;
	private sunwell: Sunwell;

	constructor(sunwell: Sunwell, props) {
		this.sunwell = sunwell;

		if (!props) {
			throw new Error("No card properties given");
		}

		this.type = props.type;
		this.cost = props.cost || 0;
		this.attack = props.attack || 0;
		this.health = props.health || 0;
		this.costsHealth = props.costsHealth || false;
		this.hideStats = props.hideStats;
		this.language = props.language || "enUS";
		this.name = props.name || "";

		this.multiClassGroup = cleanEnum(props.multiClassGroup, MultiClassGroup) as MultiClassGroup;
		this.type = cleanEnum(props.type, CardType) as CardType;
		this.race = cleanEnum(props.race, Race) as Race;

		const set = cleanEnum(props.set, CardSet) as CardSet;
		this.set = this.getCardSet(set);

		const rarity = cleanEnum(props.rarity, Rarity) as Rarity;
		this.rarity = this.getRarityGem(rarity, set);

		const cardClass = cleanEnum(props.cardClass, CardClass) as CardClass;
		this.cardClass = this.getCardFrameClass(cardClass);

		if (this.type === CardType.MINION) {
			this.raceText = props.raceText || this.getRaceText();
			this.silenced = props.silenced || false;
		}

		if (this.type === CardType.WEAPON && props.durability) {
			// Weapons alias health to durability
			this.health = props.durability;
		} else if (this.type === CardType.HERO && props.armor) {
			// Hero health gem is Armor
			this.health = props.armor;
		}

		// This only needs to change for HeroPower
		this.costTextCoords = {x: 115, y: 174};
		// Sets the player or opponent HeroPower texture
		this.opposing = props.opposing || false;

		this.elite = props.elite || false;
		this.costColor = getNumberStyle(props.costStyle);
		this.attackColor = getNumberStyle(props.costStyle);
		this.healthColor = getNumberStyle(props.healthStyle);
		this.bodyText = props.collectionText || props.text || "";
		this.titleFont = sunwell.options.titleFont;
		this.texture = props.texture;
		this.propsJson = JSON.stringify(props);
	}

	public abstract getWatermarkCoords(): ICoords;

	public initRender(width: number, target, callback?: (HTMLCanvasElement) => void): void {
		this.width = width;
		this.target = target;
		this.callback = callback;
		this.cacheKey = this.checksum();
		this.key = this.cacheKey;
		this.updateAssets();
	}

	public getAssetsToLoad(): string[] {
		const assetsToLoad: string[] = [this.cardFrameAsset];

		if (this.cardFoundationAsset) {
			assetsToLoad.push(this.cardFoundationAsset);
		}

		if (this.costGemAsset) {
			assetsToLoad.push(this.costGemAsset);
		}

		if (this.nameBannerAsset) {
			assetsToLoad.push(this.nameBannerAsset);
		}

		if (!this.hideStats) {
			if (this.attackGemAsset) {
				assetsToLoad.push(this.attackGemAsset);
			}
			if (this.healthGemAsset) {
				assetsToLoad.push(this.healthGemAsset);
			}
		}

		if (this.elite && this.dragonAsset) {
			assetsToLoad.push(this.dragonAsset);
		}
		if (this.raceText) {
			assetsToLoad.push(this.raceBannerAsset);
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
		} else if (this.texture instanceof this.sunwell.platform.Image) {
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

	public draw(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
		const ratio = this.width / ReferenceWidth;

		const drawTimeout = setTimeout(() => {
			this.sunwell.error("Drawing timed out", this.name);
		}, this.sunwell.options.drawTimeout);

		context.save();
		context.clearRect(0, 0, canvas.width, canvas.height);

		// >>>>> Begin Skeleton drawing
		if (this.sunwell.renderCache[this.cacheKey]) {
			this.sunwell.log("Skipping skeleton draw");
			context.drawImage(this.sunwell.renderCache[this.cacheKey], 0, 0);
		} else {
			this.drawCardArt(context, ratio);

			if (this.cardFoundationAsset) {
				this.drawCardFoundationAsset(context, ratio);
			}

			this.drawFrameTexture(context, ratio);

			if (this.multiBannerAsset) {
				this.drawImage(context, this.multiBannerAsset, {
					dx: 50,
					dy: 119,
					ratio: ratio,
				});
			}

			if (this.costGemAsset) {
				this.drawCostGem(context, ratio);
			}

			if (this.rarityGemAsset) {
				this.drawRarityGem(context, ratio);
			}

			if (this.nameBannerAsset) {
				this.drawNameBanner(context, ratio);
			}

			if (this.raceText) {
				this.drawRaceBanner(context, ratio);
			}

			this.drawAttackTexture(context, ratio);
			this.drawHealthTexture(context, ratio);

			if (this.elite && this.dragonAsset) {
				const coords = this.dragonCoords;
				coords.ratio = ratio;
				this.drawImage(context, this.dragonAsset, coords);
			}

			if (this.watermarkAsset) {
				this.drawWatermark(context, ratio);
			}

			if (this.sunwell.options.cacheSkeleton) {
				const cacheImage = new this.sunwell.platform.Image();
				cacheImage.src = canvas.toDataURL();
				this.sunwell.renderCache[this.cacheKey] = cacheImage;
			}
		}

		// <<<<<<<< Finished Skeleton drawing

		this.drawName(context, ratio, this.name);

		this.drawStats(context, ratio);

		if (this.raceText) {
			this.drawRaceText(context, ratio, this.raceText);
		}

		this.drawBodyText(context, ratio, false, this.bodyText);

		if (this.silenced) {
			this.drawImage(context, "silence-x", {dx: 166, dy: 584, ratio: ratio});
		}

		context.restore();
		clearTimeout(drawTimeout);

		if (this.callback) {
			this.callback(canvas);
		}

		if (this.target) {
			this.target.src = canvas.toDataURL();
		}
	}

	public drawCardArt(context, ratio: number) {
		const t = this.getCardArtTexture();

		context.save();
		drawPolygon(context, this.artClipPolygon, ratio);
		context.clip();
		context.fillStyle = "grey";
		context.fillRect(0, 0, ReferenceWidth * ratio, ReferenceHeight * ratio);
		context.drawImage(
			t,
			0,
			0,
			t.width,
			t.height,
			this.artCoords.dx * ratio,
			this.artCoords.dy * ratio,
			this.artCoords.dWidth * ratio,
			this.artCoords.dHeight * ratio
		);
		context.restore();
	}

	public drawBodyText(
		context: CanvasRenderingContext2D,
		s: number,
		forceSmallerFirstLine: boolean,
		text: string
	): void {
		const manualBreak = text.substr(0, 3) === "[x]";
		let bodyText = manualBreak ? text.substr(3) : text;
		if (!bodyText) {
			return;
		}

		const pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g;
		let xPos = 0;
		let yPos = 0;
		let italic = 0;
		let bold = 0;
		let lineCount = 0;
		let justLineBreak: boolean;
		let plurals: RegExpExecArray;
		let pBodyText: string;
		// size of the description text box
		const bodyWidth = this.bodyTextCoords.dWidth;
		const bodyHeight = this.bodyTextCoords.dHeight;
		// center of description box (x, y)
		const centerLeft = this.bodyTextCoords.dx + bodyWidth / 2;
		const centerTop = this.bodyTextCoords.dy + bodyHeight / 2;

		// draw the text box in debug mode
		if (this.sunwell.options.debug) {
			context.save();
			context.strokeStyle = "red";
			context.beginPath();
			context.rect(
				(centerLeft - bodyWidth / 2) * s,
				(centerTop - bodyHeight / 2) * s,
				bodyWidth * s,
				bodyHeight * s);
			context.closePath();
			context.stroke();
			context.restore();
		}

		pBodyText = bodyText;
		while ((plurals = pluralRegex.exec(bodyText)) !== null) {
			pBodyText = pBodyText.replace(
				plurals[0],
				plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4])
			);
		}
		bodyText = pBodyText;
		this.sunwell.log("Rendering body", bodyText);
		const words = bodyText
			.replace(/[\$#_]/g, "")
			.replace(/\n/g, " \n ")
			.replace(/ +/g, " ")
			.split(/ /g);

		const bufferText = this.sunwell.getBuffer(bodyWidth, bodyHeight, true);
		const bufferTextCtx = bufferText.getContext("2d");
		bufferTextCtx.fillStyle = this.bodyTextColor;

		let fontSize = this.sunwell.options.bodyFontSize;
		let lineHeight = this.sunwell.options.bodyLineHeight;
		const totalLength = bodyText.replace(/<\/*.>/g, "").length;
		let smallerFirstLine = false;

		const cleanText = bodyText.replace(/<\/*.>/g, "");
		this.sunwell.log("counting length of " + cleanText);
		this.sunwell.log("Length is " + totalLength);

		const bufferRow = this.sunwell.getBuffer(bufferText.width, lineHeight, true);
		const bufferRowCtx = bufferRow.getContext("2d");
		bufferRowCtx.fillStyle = this.bodyTextColor;
		// bufferRowCtx.textBaseline = this.sunwell.options.bodyBaseline;

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

		bufferRowCtx.font = this.getFontMaterial(fontSize, !!bold, !!italic);
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
				(xPos + width > bufferRow.width ||
					(smallerFirstLine && xPos + width > bufferRow.width * 0.8)) &&
				!justLineBreak
			) {
				this.sunwell.log(xPos + width, ">", bufferRow.width);
				this.sunwell.log("Calculated line break");
				smallerFirstLine = false;
				justLineBreak = true;
				lineCount++;
				[xPos, yPos] = finishLine(
					bufferTextCtx,
					bufferRow,
					bufferRowCtx,
					xPos,
					yPos,
					bufferText.width
				);
			}

			if (word === "\n") {
				this.sunwell.log("Manual line break");
				lineCount++;
				[xPos, yPos] = finishLine(
					bufferTextCtx,
					bufferRow,
					bufferRowCtx,
					xPos,
					yPos,
					bufferText.width
				);

				justLineBreak = true;
				smallerFirstLine = false;
				continue;
			}

			justLineBreak = false;

			for (let j = 0; j < word.length; j++) {
				const char = word[j];

				if (char === "<") {
					const pr = parseNextToken(word.slice(j));

					if (pr.token) {
						j += pr.token.length - 1;
						bold += pr.bold;
						italic += pr.italic;
						continue;
					}
				}

				// TODO investigate why the following two properites are being reset, for web
				// likely something to do with getLineWidth()
				bufferRowCtx.fillStyle = this.bodyTextColor;
				// move to here from pr.token block above,
				// text without markup ends up being default font otherwise
				bufferRowCtx.font = this.getFontMaterial(fontSize, !!bold, !!italic);

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
				this.drawBodyText(context, s, true, this.bodyText);
				return;
			}
		}

		const b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		context.drawImage(
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

	public drawName(context: CanvasRenderingContext2D, ratio: number, name: string): void {
		// define a box to contain the curved text
		const boxDims = {width: 460, height: 160};
		const boxBottomCenter = {x: 335, y: 612};
		// create a new buffer to draw onto
		const buffer = this.sunwell.getBuffer(boxDims.width * 2, boxDims.height, true);
		const textContext = buffer.getContext("2d");
		const maxWidth = this.nameTextCurve.maxWidth;
		const curve = this.nameTextCurve.curve;
		textContext.save();

		if (this.sunwell.options.debug) {
			textContext.lineWidth = 2;
			textContext.strokeStyle = "blue";
			textContext.fillStyle = "red";
			// draw the curve
			textContext.beginPath();
			textContext.moveTo(curve[0].x, curve[0].y);
			textContext.bezierCurveTo(curve[1].x, curve[1].y, curve[2].x, curve[2].y, curve[3].x, curve[3].y);
			textContext.stroke();
			// draw the control points
			for (const point of curve) {
				textContext.fillRect(point.x - 4, point.y - 4, 8, 8);
			}
			textContext.restore();
		}

		textContext.lineWidth = 10;
		textContext.strokeStyle = "black";
		textContext.lineCap = "round";
		textContext.lineJoin = "round";
		textContext.textAlign = "left";
		textContext.textBaseline = "middle";

		// calculate text width
		const getCharDimensions = () => {
			const dim = [];
			const em = textContext.measureText("M").width;
			for (let i = 0; i < name.length; i++) {
				textContext.save();
				const char = name[i];
				const scale = {x: 1, y: 1};
				let charWidth = textContext.measureText(char).width + 0.1 * em;
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
				dim[i] = {
					width: charWidth,
					scale: scale,
				};
				textContext.restore();
			}
			return dim;
		};

		let fontSize = 45;
		let dimensions = [];
		do {
			fontSize -= 1;
			textContext.font = fontSize + "px " + this.titleFont;
		} while (
			(dimensions = getCharDimensions()).reduce((a, b) => a + b.width, 0) > maxWidth &&
			fontSize > 10
		);

		const textWidth = dimensions.reduce((a, b) => a + b.width, 0) / maxWidth;
		const begin = this.nameTextCurve.pathMiddle - textWidth / 2;
		const steps = textWidth / name.length;

		// draw text
		let p: IPoint;
		let t: number;
		let leftPos = 0;
		for (let i = 0; i < name.length; i++) {
			const char = name[i].trim();
			const dimension = dimensions[i];
			if (leftPos === 0) {
				t = begin + steps * i;
				p = getPointOnCurve(curve, t);
				leftPos = p.x;
			} else {
				t += 0.01;
				p = getPointOnCurve(curve, t);
				while (p.x < leftPos) {
					t += 0.001;
					p = getPointOnCurve(curve, t);
				}
			}

			if (char.length) {
				textContext.save();
				textContext.translate(p.x, p.y);

				if (dimension.scale.x) {
					textContext.scale(dimension.scale.x, dimension.scale.y);
				}
				// textContext.setTransform(1.2, p.r, 0, 1, p.x, p.y);
				textContext.rotate(p.r);

				// shadow
				textContext.lineWidth = 9 * (fontSize / 50);
				textContext.strokeStyle = "black";
				textContext.fillStyle = "black";
				textContext.fillText(char, 0, 0);
				textContext.strokeText(char, 0, 0);

				// text
				textContext.fillStyle = "white";
				textContext.strokeStyle = "white";
				textContext.lineWidth = 2.5 * (fontSize / 50);
				textContext.fillText(char, 0, 0);

				textContext.restore();
			}

			leftPos += dimension.width;
		}

		const coords: ICoords = {
			sx: 0,
			sy: 0,
			sWidth: boxDims.width,
			sHeight: boxDims.height,
			dx: (boxBottomCenter.x - boxDims.width / 2) * ratio,
			dy: (boxBottomCenter.y - boxDims.height) * ratio,
			dWidth: boxDims.width * ratio,
			dHeight: boxDims.height * ratio,
		};
		context.drawImage(
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

	public drawNameBanner(context: CanvasRenderingContext2D, ratio: number) {
		const coords = this.nameBannerCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.nameBannerAsset, coords);
	}

	public drawRaceBanner(context: CanvasRenderingContext2D, ratio: number) {
		const coords = this.raceBannerCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.raceBannerAsset, coords);
	}

	/**
	 * Renders a given number to the defined position.
	 * The x/y position should be the position on an unscaled card.
	 */
	public drawNumber(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		s: number,
		num: number,
		size: number,
		color: string
	): void {
		const buffer = this.sunwell.getBuffer(256, 256, true);
		const bufferCtx = buffer.getContext("2d");
		const n = num.toString().split("");
		let tX = 10;

		bufferCtx.font = size + "px " + this.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textAlign = "left";
		bufferCtx.textBaseline = "hanging";

		for (const cnum of n) {
			bufferCtx.lineWidth = 10;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(cnum, tX, 10);
			bufferCtx.strokeText(cnum, tX, 10);

			bufferCtx.fillStyle = color;
			bufferCtx.strokeStyle = color;
			bufferCtx.lineWidth = 2.5;
			bufferCtx.fillText(cnum, tX, 10);
			// context.strokeText(cnum, x, y);

			tX += bufferCtx.measureText(cnum).width;
		}

		const b = contextBoundingBox(bufferCtx);

		context.drawImage(
			buffer,
			b.x,
			b.y,
			b.w,
			b.h,
			(x - b.w / 2) * s,
			(y - b.h / 2) * s,
			b.w * s,
			b.h * s
		);

		this.sunwell.freeBuffer(buffer);
	}

	public drawRaceText(context, ratio: number, raceText: string): void {
		const buffer = this.sunwell.getBuffer(300, 60, true);
		const bufferCtx = buffer.getContext("2d");
		let x = 10;
		const text = raceText.split("");
		const textSize = 40;

		bufferCtx.font = textSize + "px " + this.titleFont;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";
		bufferCtx.textAlign = "left";

		const xWidth = bufferCtx.measureText("x").width;
		for (const char of text) {
			bufferCtx.lineWidth = 7;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(char, x, 10);
			bufferCtx.strokeText(char, x, 10);

			bufferCtx.fillStyle = "white";
			bufferCtx.strokeStyle = "white";
			bufferCtx.lineWidth = 1;
			bufferCtx.fillText(char, x, 10);
			// context.strokeText(char, x, y);

			x += bufferCtx.measureText(char).width;
			x += xWidth * 0.1;
		}

		const b = contextBoundingBox(bufferCtx);

		context.drawImage(
			buffer,
			b.x,
			b.y,
			b.w,
			b.h,
			(this.raceTextCoords.dx - b.w / 2) * ratio,
			(this.raceTextCoords.dy - b.h / 2) * ratio,
			b.w * ratio,
			b.h * ratio
		);

		this.sunwell.freeBuffer(buffer);
	}

	public drawCostGem(context: CanvasRenderingContext2D, ratio: number): void {
		const pt = {x: 47, y: 105};
		if (this.costsHealth) {
			pt.x = 43;
			pt.y = 58;
		}
		this.drawImage(context, this.costGemAsset, {dx: pt.x, dy: pt.y, ratio: ratio});
	}

	public drawRarityGem(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.rarityGemCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.rarityGemAsset, coords);
	}

	public drawStats(context: CanvasRenderingContext2D, ratio: number): void {
		const costTextSize = 130;
		const statTextSize = 124;

		if (this.hideStats) {
			return;
		}

		this.drawNumber(
			context,
			this.costTextCoords.x,
			this.costTextCoords.y,
			ratio,
			this.cost,
			costTextSize,
			this.costColor
		);

		if (this.type === CardType.HERO_POWER) {
			return;
		}

		if (this.attackTextCoords) {
			this.drawNumber(
				context,
				this.attackTextCoords.x,
				this.attackTextCoords.y,
				ratio,
				this.attack,
				statTextSize,
				this.attackColor
			);
		}

		if (this.healthTextCoords) {
			this.drawNumber(
				context,
				this.healthTextCoords.x,
				this.healthTextCoords.y,
				ratio,
				this.health,
				statTextSize,
				this.healthColor
			);
		}
	}

	public drawAttackTexture(context: CanvasRenderingContext2D, ratio: number): void {
		if (this.hideStats || !this.healthGemAsset) {
			return;
		}
		const coords = this.healthGemCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.healthGemAsset, coords);
	}

	public drawHealthTexture(context: CanvasRenderingContext2D, ratio: number): void {
		if (this.hideStats || !this.attackGemAsset) {
			return;
		}
		const coords = this.attackGemCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.attackGemAsset, coords);
	}

	public drawFrameTexture(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.baseCardFrameCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.cardFrameAsset, coords);
	}

	public drawCardFoundationAsset(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.cardFoundationCoords;
		coords.ratio = ratio;
		this.drawImage(context, this.cardFoundationAsset, coords);
	}

	public drawWatermark(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.getWatermarkCoords();
		coords.ratio = ratio;

		if (this.type === CardType.HERO_POWER) {
			return;
		} else if (this.premium || this.type === CardType.MINION || this.type === CardType.HERO) {
			context.globalCompositeOperation = "multiply";
			context.globalAlpha = 0.6;
		} else if (this.type === CardType.SPELL) {
			context.globalCompositeOperation = "multiply";
			context.globalAlpha = 0.7;
		} else if (this.type === CardType.WEAPON) {
			context.globalCompositeOperation = "lighten";
			context.globalAlpha = 0.1;
		}

		this.drawImage(context, this.watermarkAsset, coords);

		context.globalCompositeOperation = "source-over";
		context.globalAlpha = 1;
	}

	protected getFontMaterial(fontSize: number, bold: boolean, italic: boolean): string {
		let font: string;
		let prefix = "";

		if (bold) {
			font = this.sunwell.options.bodyFontBold;
			prefix = "bold ";
		} else if (italic) {
			font = this.sunwell.options.bodyFontItalic;
			prefix = "italic ";
		} else {
			font = this.sunwell.options.bodyFontRegular;
		}

		return `${prefix}${fontSize}px/1em "${font}", sans-serif`;
	}

	protected getLineWidth(
		context: CanvasRenderingContext2D,
		fontSize: number,
		line: string
	): number {
		let width = 0;
		let bold = 0;
		let italic = 0;

		for (const word of line.split(" ")) {
			for (let j = 0; j < word.length; j++) {
				const char = word[j];

				if (char === "<") {
					const pr = parseNextToken(word.slice(j));

					if (pr.token) {
						j += pr.token.length - 1;
						bold += pr.bold;
						italic += pr.italic;
						context.font = this.getFontMaterial(fontSize, !!bold, !!italic);
						continue;
					}
				}

				context.fillText(
					char,
					width + this.sunwell.options.bodyFontOffset.x,
					this.sunwell.options.bodyFontOffset.y
				);

				width += context.measureText(char).width;
			}
			width += 0.275 * context.measureText("M").width;
		}

		return width;
	}

	private checksum(): number {
		const s = this.propsJson + this.width + this.premium;
		const length = s.length;
		let chk = 0;
		for (let i = 0; i < length; i++) {
			const char = s.charCodeAt(i);
			chk = (chk << 5) - chk + char;
			chk |= 0;
		}

		return chk;
	}

	private updateAssets(): void {
		if (this.type === CardType.HERO_POWER) {
			this.cardFrameAsset = this.baseCardFrameAsset + (this.opposing ? "opponent" : "player");
		} else {
			this.cardFrameAsset = this.baseCardFrameAsset + CardClass[this.cardClass].toLowerCase();
		}

		if (this.rarity) {
			this.rarityGemAsset = this.baseRarityGemAsset + Rarity[this.rarity].toLowerCase();
		}

		if (this.type === CardType.HERO_POWER) {
			this.costGemAsset = null;
		} else if (this.costsHealth) {
			this.costGemAsset = "cost-health";
		} else {
			this.costGemAsset = "cost-mana";
		}

		if (this.multiClassGroup) {
			this.multiBannerAsset = "multi-" + MultiClassGroup[this.multiClassGroup].toLowerCase();
		}

		if (this.set) {
			this.watermarkAsset = "set-" + CardSet[this.set].toLowerCase();
		}
	}

	private drawImage(context: CanvasRenderingContext2D, assetKey: string, coords: ICoords): void {
		const asset = this.sunwell.getAsset(assetKey);
		if (!asset) {
			this.sunwell.error("Not drawing asset", assetKey);
			return;
		}
		const ratio = coords.ratio || 1;
		const width = coords.sWidth || asset.width;
		const height = coords.sHeight || asset.height;
		context.drawImage(
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

	private getCardFrameClass(cardClass: CardClass): CardClass {
		switch (this.cardClass) {
			case CardClass.DREAM:
				return CardClass.HUNTER;
			case CardClass.INVALID:
				return CardClass.NEUTRAL;
			default:
				return cardClass;
		}
	}

	private getCardSet(set: CardSet): CardSet {
		switch (set) {
			case CardSet.EXPERT1:
			case CardSet.NAXX:
			case CardSet.GVG:
			case CardSet.BRM:
			case CardSet.TGT:
			case CardSet.LOE:
			case CardSet.OG:
			case CardSet.KARA:
			case CardSet.GANGS:
			case CardSet.UNGORO:
			case CardSet.ICECROWN:
			case CardSet.HOF:
				return set;
			default:
				return null;
		}
	}

	private getRarityGem(rarity: Rarity, set: CardSet): Rarity {
		switch (rarity) {
			case Rarity.INVALID:
			case Rarity.FREE:
				return null;
			case Rarity.COMMON:
				if (set === CardSet.CORE) {
					return null;
				}
		}

		return rarity;
	}
}
