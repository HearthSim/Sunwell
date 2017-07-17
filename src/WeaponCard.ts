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

	public getWatermarkCoords() {
		return {
			dx: 264,
			dy: 735,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
