import {CardClass, CardSet, CardType, Race, Rarity} from "./Enums";
import {IPoint} from "./interfaces";

const RaceNames = {
	[Race.MURLOC]: {
		enUS: "Murloc",
		frFR: "Murloc",
		deDE: "Murloc",
		koKR: "멀록",
		esES: "Múrloc",
		esMX: "Múrloc",
		ruRU: "Мурлок",
		zhTW: "魚人",
		zhCN: "鱼人",
		itIT: "Murloc",
		ptBR: "Murloc",
		plPL: "Murlok",
		jaJP: "マーロック",
		thTH: "เมอร์ล็อค",
	},
	[Race.MECHANICAL]: {
		enUS: "Mech",
		frFR: "Méca",
		deDE: "Mech",
		koKR: "기계",
		esES: "Robot",
		esMX: "Meca",
		ruRU: "Механизм",
		zhTW: "機械",
		zhCN: "机械",
		itIT: "Robot",
		ptBR: "Mecanoide",
		plPL: "Mech",
		jaJP: "メカ",
		thTH: "เครื่องจักร",
	},
	[Race.ELEMENTAL]: {
		enUS: "Elemental",
		frFR: "Élémentaire",
		deDE: "Elementar",
		koKR: "정령",
		esES: "Elemental",
		esMX: "Elemental",
		ruRU: "Элементаль",
		zhTW: "元素",
		zhCN: "元素",
		itIT: "Elementale",
		ptBR: "Elemental",
		plPL: "Żywiołak",
		jaJP: "エレメンタル",
		thTH: "วิญญาณธาตุ",
	},
	[Race.PET]: {
		enUS: "Beast",
		frFR: "Bête",
		deDE: "Wildtier",
		koKR: "야수",
		esES: "Bestia",
		esMX: "Bestia",
		ruRU: "Зверь",
		zhTW: "野獸",
		zhCN: "野兽",
		itIT: "Bestia",
		ptBR: "Fera",
		plPL: "Bestia",
		jaJP: "獣",
		thTH: "สัตว์",
	},
	[Race.DEMON]: {
		enUS: "Demon",
		frFR: "Démon",
		deDE: "Dämon",
		koKR: "악마",
		esES: "Demonio",
		esMX: "Demonio",
		ruRU: "Демон",
		zhTW: "惡魔",
		zhCN: "恶魔",
		itIT: "Demone",
		ptBR: "Demônio",
		plPL: "Demon",
		jaJP: "悪魔",
		thTH: "ปีศาจ",
	},
	[Race.PIRATE]: {
		enUS: "Pirate",
		frFR: "Pirate",
		deDE: "Pirat",
		koKR: "해적",
		esES: "Pirata",
		esMX: "Pirata",
		ruRU: "Пират",
		zhTW: "海盜",
		zhCN: "海盗",
		itIT: "Pirata",
		ptBR: "Pirata",
		plPL: "Pirat",
		jaJP: "海賊",
		thTH: "โจรสลัด",
	},
	[Race.DRAGON]: {
		enUS: "Dragon",
		frFR: "Dragon",
		deDE: "Drache",
		koKR: "용족",
		esES: "Dragón",
		esMX: "Dragón",
		ruRU: "Дракон",
		zhTW: "龍類",
		zhCN: "龙",
		itIT: "Drago",
		ptBR: "Dragão",
		plPL: "Smok",
		jaJP: "ドラゴン",
		thTH: "มังกร",
	},
	[Race.TOTEM]: {
		enUS: "Totem",
		frFR: "Totem",
		deDE: "Totem",
		koKR: "토템",
		esES: "Tótem",
		esMX: "Tótem",
		ruRU: "Тотем",
		zhTW: "圖騰",
		zhCN: "图腾",
		itIT: "Totem",
		ptBR: "Totem",
		plPL: "Totem",
		jaJP: "トーテム",
		thTH: "โทเท็ม",
	},
	[Race.ALL]: {
		enUS: "All",
		frFR: "Tout",
		deDE: "Alle",
		koKR: "모두",
		esES: "Todos",
		esMX: "Todas",
		ruRU: "Все",
		zhTW: "全部",
		zhCN: "全部",
		itIT: "Tutti",
		ptBR: "Tudo",
		plPL: "Wszystkie",
		jaJP: "全て",
		thTH: "ทุกอย่าง",
	},
};

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

export function getCardFrameClass(cardClass: CardClass): CardClass {
	switch (cardClass) {
		case CardClass.DREAM:
			return CardClass.HUNTER;
		case CardClass.INVALID:
		case CardClass.WHIZBANG:
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
