import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class MinionCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 520, height: 290};
	public nameBannerAsset = "name-banner-minion";
	public attackGemAsset = "attack-minion";
	public healthGemAsset = "health";
	public attackGemCoords = {
		sWidth: 214,
		sHeight: 238,
		dx: 0,
		dy: 862,
		dWidth: 214,
		dHeight: 238,
	};
	public healthGemCoords = {
		sWidth: 167,
		sHeight: 218,
		dx: 575,
		dy: 876,
		dWidth: 167,
		dHeight: 218,
	};

	public nameBannerCoords = {
		sWidth: 608,
		sHeight: 144,
		dx: 94,
		dy: 546,
		dWidth: 608,
		dHeight: 144,
	};

	public getCardFrameAsset(cardClass) {
		return "frame-minion-" + CardClass[cardClass].toLowerCase();
	}

	public getRarityGemAsset(rarity) {
		return "rarity-minion-" + Rarity[rarity].toLowerCase();
	}

	public rarityGemCoords = {dx: 327, dy: 607};

	public getWatermarkCoords() {
		let dy = 735;
		if (this.raceText) {
			dy -= 10; // Shift up
		}

		return {
			dx: 270,
			dy: dy,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
