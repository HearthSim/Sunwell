import chars from "chars";
import {CardClass, CardSet, CardType, Race, Rarity} from "./Enums";
import {IPoint} from "./interfaces";

const RaceNames = {};
RaceNames[Race.MURLOC] = {enUS: "Murloc"};
RaceNames[Race.MECHANICAL] = {enUS: "Mech"};
RaceNames[Race.ELEMENTAL] = {enUS: "Elemental"};
RaceNames[Race.BEAST] = {enUS: "Beast"};
RaceNames[Race.DEMON] = {enUS: "Demon"};
RaceNames[Race.PIRATE] = {enUS: "Pirate"};
RaceNames[Race.DRAGON] = {enUS: "Dragon"};
RaceNames[Race.TOTEM] = {enUS: "Totem"};
RaceNames[Race.ALL] = {enUS: "All"};

export function cleanEnum(val: string | number, e) {
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
 * Get the bounding box of a canvas content.
 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
 */
export function contextBoundingBox(context: CanvasRenderingContext2D) {
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

export function getNumberStyle(style: string) {
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
export function finishLine(
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
 * Given a curve and t, the function returns the point on the curve.
 * r is the rotation of the point in radians.
 * @returns {{x: (number|*), y: (number|*), r: number}}
 */
export function getPointOnCurve(curve: IPoint[], t: number): IPoint {
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

export function getCharDimensions(text: string, textContext) {
	const dim = [];
	const em = textContext.measureText("M").width;
	for (const char of chars(text)) {
		textContext.save();
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
		dim.push({
			scale: scale,
			width: charWidth,
		});
		textContext.restore();
	}
	return dim;
}

export function getCardFrameClass(cardClass: CardClass) {
	switch (cardClass) {
		case CardClass.DREAM:
			return CardClass.HUNTER;
		case CardClass.INVALID:
			return CardClass.NEUTRAL;
		default:
			return cardClass;
	}
}

export function getRaceText(race: Race, cardType: CardType, language: string): string {
	if (cardType === CardType.MINION && race in RaceNames) {
		return RaceNames[race][language] || "";
	}
	return "";
}

export function getRarityGem(rarity: Rarity, set: CardSet, type?: CardType): Rarity {
	switch (rarity) {
		case Rarity.INVALID:
		case Rarity.FREE:
			return type === CardType.HERO ? Rarity.COMMON : null;
		case Rarity.COMMON:
			if (set === CardSet.CORE) {
				return null;
			}
	}
	return rarity;
}
