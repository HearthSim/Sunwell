import Card from "./Card";

export default class HeroCard extends Card {
	public premium = false;
	public bodyTextColor = "black";
	public bodyTextCoords = {
		dx: 143,
		dy: 627,
		dWidth: 376,
		dHeight: 168,
		sWidth: 376,
		sHeight: 168,
	};
	public cardFoundationAsset = null;
	public cardFoundationCoords = null;
	public baseCardFrameAsset = "frame-hero-";
	public baseCardFrameCoords = {
		sWidth: 527,
		sHeight: 795,
		dx: 70,
		dy: 87,
		dWidth: 527,
		dHeight: 795,
	};
	public baseRarityGemAsset = "rarity-";
	public eliteDragonAsset = "elite-hero";
	public eliteDragonCoords = {
		dx: 172,
		dy: 40,
		dWidth: 444,
		dHeight: 298,
		sWidth: 444,
		sHeight: 298,
	};
	public nameBannerAsset = "name-banner-hero";
	public nameBannerCoords = {
		sWidth: 490,
		sHeight: 122,
		dx: 91,
		dy: 458,
		dWidth: 490,
		dHeight: 122,
	};
	public nameTextCurve = {
		pathMiddle: 0.5,
		maxWidth: 420,
		curve: [{x: 24, y: 98}, {x: 170, y: 36}, {x: 294, y: 36}, {x: 438, y: 96}],
	};
	public rarityGemCoords = {dx: 311, dy: 529};
	public artCoords = {
		sWidth: 346,
		sHeight: 346,
		dx: 161,
		dy: 137,
		dWidth: 346,
		dHeight: 346,
	};
	public artClipPolygon = [
		{x: 334, y: 134},
		{x: 369, y: 143},
		{x: 406, y: 164},
		{x: 435, y: 187},
		{x: 453, y: 213},
		{x: 469, y: 245},
		{x: 479, y: 270},
		{x: 481, y: 290},
		{x: 483, y: 332},
		{x: 483, y: 380},
		{x: 483, y: 438},
		{x: 484, y: 485},
		{x: 435, y: 473},
		{x: 389, y: 467},
		{x: 346, y: 465},
		{x: 297, y: 466},
		{x: 240, y: 473},
		{x: 185, y: 486},
		{x: 184, y: 445},
		{x: 182, y: 357},
		{x: 184, y: 302},
		{x: 188, y: 271},
		{x: 198, y: 240},
		{x: 210, y: 217},
		{x: 222, y: 198},
		{x: 239, y: 178},
		{x: 262, y: 160},
		{x: 291, y: 145},
	];

	public getHealthGemAsset() {
		return this.cardDef.armor ? "armor" : "health";
	}

	public getHealthGemCoords() {
		if (this.cardDef.armor) {
			return {
				sWidth: 115,
				sHeight: 135,
				dx: 498,
				dy: 752,
				dWidth: 115,
				dHeight: 135,
			};
		} else {
			return {
				sWidth: 109,
				sHeight: 164,
				dx: 504,
				dy: 728,
				dWidth: 109,
				dHeight: 164,
			};
		}
	}

	public getHealthTextCoords() {
		if (this.cardDef.armor) {
			return {dx: 554, dy: 822};
		} else {
			return {dx: 556, dy: 825};
		}
	}

	public getWatermarkCoords() {
		return {
			dx: 247,
			dy: 625,
			dWidth: 170,
			dHeight: 170,
		};
	}
}
