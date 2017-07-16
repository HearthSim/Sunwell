import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class MinionCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 520, height: 290};
	public nameBannerAsset = "name-banner-minion";

	public getNameBannerCoords() {
		return {
			sWidth: 608,
			sHeight: 144,
			dx: 94,
			dy: 546,
			dWidth: 608,
			dHeight: 144,
		};
	}

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
