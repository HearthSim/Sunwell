import Card from "./Card";

export default class SpellCard extends Card {
	public premium = false;
	public bodyTextColor = "black";
	public bodyTextCoords = {
		dx: 144,
		dy: 630,
		dWidth: 378,
		dHeight: 168,
		sWidth: 378,
		sHeight: 168,
	};
	public cardFoundationAsset = null;
	public cardFoundationCoords = null;
	public baseCardFrameAsset = "frame-spell-";
	public baseCardFrameCoords = {
		dx: 70,
		dy: 133,
		dWidth: 527,
		dHeight: 746,
	};
	public baseRarityGemAsset = "rarity-spell-";
	public eliteDragonAsset = "elite-spell";
	public eliteDragonCoords = {
		sWidth: 476,
		sHeight: 259,
		dx: 185,
		dy: 91,
		dWidth: 476,
		dHeight: 259,
	};
	public nameBannerAsset = "name-banner-spell";
	public nameBannerCoords = {
		sWidth: 507,
		sHeight: 155,
		dx: 80,
		dy: 457,
		dWidth: 507,
		dHeight: 155,
	};
	public rarityGemCoords = {
		sWidth: 116,
		sHeight: 77,
		dx: 272,
		dy: 541,
		dWidth: 116,
		dHeight: 77,
	};
	public nameTextCurve = {
		pathMiddle: 0.49,
		maxWidth: 450,
		curve: [{x: 10, y: 78}, {x: 170, y: 36}, {x: 294, y: 36}, {x: 450, y: 80}],
	};
	public artCoords = {
		sWidth: 418,
		sHeight: 418,
		dx: 123,
		dy: 138,
		dWidth: 418,
		dHeight: 418,
	};
	public artClipPolygon = [
		{x: 338, y: 171},
		{x: 425, y: 179},
		{x: 544, y: 213},
		{x: 551, y: 474},
		{x: 439, y: 511},
		{x: 327, y: 519},
		{x: 202, y: 505},
		{x: 118, y: 474},
		{x: 116, y: 213},
		{x: 236, y: 176},
	];

	public getWatermarkCoords() {
		return {
			dx: 232,
			dy: 612,
			dWidth: 210,
			dHeight: 210,
		};
	}
}
