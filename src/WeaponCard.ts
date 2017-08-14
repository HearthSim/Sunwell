import Card from "./Card";

export default class WeaponCard extends Card {
	public bodyTextColor = "white";
	public bodyTextSize = {width: 470, height: 250};
	public baseCardFrameAsset = "frame-weapon-";
	public nameBannerAsset = "name-banner-weapon";
	public baseRarityGemAsset = "rarity-weapon-";
	public dragonAsset = null;
	public dragonCoords = null;
	public attackGemAsset = "attack-weapon";
	public healthGemAsset = "durability";
	public attackGemCoords = {
		sWidth: 312,
		sHeight: 306,
		dx: 32,
		dy: 906,
		dWidth: 187,
		dHeight: 183,
	};
	public attackTextCoords = {x: 118, y: 994};
	public healthGemCoords = {
		sWidth: 301,
		sHeight: 333,
		dx: 584,
		dy: 890,
		dWidth: 186,
		dHeight: 205,
	};
	public healthTextCoords = {x: 668, y: 994};
	public nameBannerCoords = {
		sWidth: 660,
		sHeight: 140,
		dx: 56,
		dy: 551,
		dWidth: 660,
		dHeight: 140,
	};
	public rarityGemCoords = {dx: 311, dy: 607};
	public nameTextCurve = {
		pathMiddle: 0.56,
		maxWidth: 580,
		curve: [{x: 10, y: 77}, {x: 50, y: 77}, {x: 500, y: 77}, {x: 570, y: 77}],
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
			dx: 264,
			dy: 735,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
