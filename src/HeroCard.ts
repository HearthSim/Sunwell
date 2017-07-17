import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class HeroCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 490, height: 290};
	public nameBannerAsset = "name-banner-hero";
	public dragonAsset = "elite-hero";
	public dragonCoords = null; // TODO
	public attackGemAsset = null;
	public healthGemAsset = "armor";
	public attackGemCoords = null;
	public attackTextCoords = null;
	public healthGemCoords = {
		sWidth: 92,
		sHeight: 109,
		dx: 603,
		dy: 912,
		dWidth: 147,
		dHeight: 174,
	};
	public healthTextCoords = {x: 668, y: 994};
	public nameBannerCoords = {
		sWidth: 627,
		sHeight: 156,
		dx: 81,
		dy: 535,
		dWidth: 627,
		dHeight: 156,
	};
	public rarityGemCoords = {dx: 327, dy: 607};
	public nameTextCurve = {
		pathMiddle: 0.56,
		maxWidth: 520,
		curve: [{x: 0, y: 135}, {x: 220, y: 42}, {x: 350, y: 42}, {x: 570, y: 125}],
	};

	public getCardFrameAsset(cardClass) {
		return "frame-hero-" + CardClass[cardClass].toLowerCase();
	}

	public getRarityGemAsset(rarity) {
		return "rarity-hero-" + Rarity[rarity].toLowerCase();
	}

	public getWatermarkCoords() {
		return {
			dx: 270,
			dy: 735,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
