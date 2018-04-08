import Card from "./Card";

export default class HeroPowerCard extends Card {
	public premium = false;
	public bodyTextColor = "black";
	public bodyTextCoords = {
		dx: 144,
		dy: 606,
		dWidth: 380,
		dHeight: 174,
		sWidth: 380,
		sHeight: 174,
	};
	public cardFoundationAsset = null;
	public cardFoundationCoords = null;
	public baseCardFrameAsset = "hero-power-";
	public baseCardFrameCoords = {
		sWidth: 564,
		sHeight: 841,
		dx: 56,
		dy: 65,
		dWidth: 564,
		dHeight: 841,
	};
	public baseRarityGemAsset = null;
	public nameBannerAsset = null;
	public nameBannerCoords = null;
	public rarityGemCoords = null;
	public nameTextCurve = {
		pathMiddle: 0.54,
		maxWidth: 440,
		curve: [{x: 10, y: 37}, {x: 110, y: 37}, {x: 350, y: 37}, {x: 450, y: 37}],
	};
	public artCoords = {
		sWidth: 261,
		sHeight: 261,
		dx: 208,
		dy: 163,
		dWidth: 261,
		dHeight: 261,
	};
	public artClipPolygon = [
		{x: 344, y: 161},
		{x: 264, y: 173},
		{x: 204, y: 257},
		{x: 207, y: 331},
		{x: 234, y: 394},
		{x: 333, y: 431},
		{x: 424, y: 407},
		{x: 465, y: 355},
		{x: 471, y: 261},
		{x: 427, y: 187},
	];

	public getWatermarkCoords() {
		return {
			dx: 0,
			dy: 0,
			dWidth: 0,
			dHeight: 0,
		};
	}

	public getCardFrameAsset(): string {
		return this.baseCardFrameAsset + (this.opposing ? "opponent" : "player");
	}

	public getCostGemAsset(): string {
		return "";
	}

	public getCostTextCoords() {
		return {dx: 338, dy: 124};
	}

	public getRarityGemAsset(): string {
		return "";
	}

	public getWatermarkAsset(): string {
		return "";
	}
}
