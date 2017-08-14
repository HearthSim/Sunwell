import Card from "./Card";

export default class SpellCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 460, height: 290};
	public baseCardFrameAsset = "frame-spell-";
	public baseCardFrameCoords = {
		dx: 70,
		dy: 133,
		dWidth: 527,
		dHeight: 746
	}
	public baseRarityGemAsset = "rarity-spell-";
	public nameBannerAsset = "name-banner-spell";
	public dragonAsset = "elite-spell";
	public dragonCoords = {
		sWidth: 476,
		sHeight: 259,
		dx: 185,
		dy: 91,
		dWidth: 476,
		dHeight: 259,
	};
	public attackGemAsset = null;
	public healthGemAsset = null;
	public attackGemCoords = null;
	public attackTextCoords = null;
	public healthGemCoords = null;
	public healthTextCoords = null;
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
		dHeight: 77
	};
	public nameTextCurve = {
		pathMiddle: 0.49,
		maxWidth: 560,
		curve: [{x: 10, y: 97}, {x: 212, y: 45}, {x: 368, y: 45}, {x: 570, y: 100}],
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
		{x: 236, y: 176}
	];

	public getWatermarkCoords() {
		return {
			dx: 231,
			dy: 618,
			dWidth: 210,
			dHeight: 210,
		};
	}
}
