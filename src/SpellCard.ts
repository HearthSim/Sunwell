import Card from "./Card";

export default class SpellCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 460, height: 290};
	public baseCardFrameAsset = "frame-spell-";
	public baseRarityGemAsset = "rarity-spell-";
	public nameBannerAsset = "name-banner-spell";
	public dragonAsset = "elite-spell";
	public dragonCoords = {dx: 201, dy: 70, dWidth: 601};
	public attackGemAsset = null;
	public healthGemAsset = null;
	public attackGemCoords = null;
	public attackTextCoords = null;
	public healthGemCoords = null;
	public healthTextCoords = null;
	public nameBannerCoords = {
		sWidth: 646,
		sHeight: 199,
		dx: 66,
		dy: 530,
		dWidth: 646,
		dHeight: 199,
	};
	public rarityGemCoords = {dx: 311, dy: 607};
	public nameTextCurve = {
		pathMiddle: 0.49,
		maxWidth: 560,
		curve: [{x: 10, y: 97}, {x: 212, y: 45}, {x: 368, y: 45}, {x: 570, y: 100}],
	};

	public getWatermarkCoords() {
		return {
			dx: 264,
			dy: 726,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
