import Card from "./Card";

export default class WeaponCard extends Card {
	public bodyTextColor = "white";
	public bodyTextSize = {width: 470, height: 250};
	public baseCardFrameAsset = "frame-weapon-";
	public baseCardFrameCoords = {
		sWidth: 527,
		sHeight: 775,
		dx: 80,
		dy: 103,
		dWidth: 527,
		dHeight: 775,
	};
	public nameBannerAsset = "name-banner-weapon";
	public baseRarityGemAsset = "rarity-weapon-";
	public dragonAsset = null;
	public dragonCoords = null;
	public attackGemAsset = "attack-weapon";
	public healthGemAsset = "durability";
	public attackGemCoords = {
		sWidth: 135,
		sHeight: 133,
		dx: 65,
		dy: 753,
		dWidth: 135,
		dHeight: 133,
	};
	public attackTextCoords = {x: 118, y: 994};
	public healthGemCoords = {
		sWidth: 126,
		sHeight: 140,
		dx: 501,
		dy: 744,
		dWidth: 126,
		dHeight: 140,
	};
	public healthTextCoords = {x: 668, y: 994};
	public nameBannerCoords = {
		sWidth: 514,
		sHeight: 108,
		dx: 87,
		dy: 468,
		dWidth: 514,
		dHeight: 108,
	};
	public rarityGemCoords = {
		sWidth: 96,
		sHeight: 90,
		dx: 302,
		dy: 520,
		dWidth: 96,
		dHeight: 90,
	};
	public nameTextCurve = {
		pathMiddle: 0.56,
		maxWidth: 450,
		curve: [{x: 18, y: 56}, {x: 66, y: 56}, {x: 400, y: 56}, {x: 456, y: 56}],
	};
	public artCoords = {
		sWidth: 384,
		sHeight: 384,
		dx: 152,
		dy: 135,
		dWidth: 384,
		dHeight: 384,
	};
	public artClipPolygon = [
		{x: 352, y: 139},
		{x: 418, y: 155},
		{x: 469, y: 188},
		{x: 497, y: 222},
		{x: 523, y: 267},
		{x: 533, y: 315},
		{x: 531, y: 366},
		{x: 514, y: 420},
		{x: 485, y: 461},
		{x: 444, y: 496},
		{x: 375, y: 515},
		{x: 309, y: 515},
		{x: 236, y: 484},
		{x: 192, y: 434},
		{x: 160, y: 371},
		{x: 158, y: 303},
		{x: 173, y: 246},
		{x: 203, y: 201},
		{x: 242, y: 167},
		{x: 287, y: 148},
	];

	public getWatermarkCoords() {
		return {
			dx: 241,
			dy: 599,
			dWidth: 220,
			dHeight: 220,
		};
	}
}
