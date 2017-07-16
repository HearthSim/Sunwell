import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class WeaponCard extends Card {
	public bodyTextColor = "white";
	public bodyTextSize = {width: 470, height: 250};
	public nameBannerAsset = "name-banner-weapon";

	public getNameBannerCoords() {
		return {
			sWidth: 660,
			sHeight: 140,
			dx: 56,
			dy: 551,
			dWidth: 660,
			dHeight: 140,
		};
	}

	public getCardFrameAsset(cardClass) {
		return "frame-weapon-" + CardClass[cardClass].toLowerCase();
	}

	public getRarityGemAsset(rarity) {
		return "rarity-weapon-" + Rarity[rarity].toLowerCase();
	}

	public rarityGemCoords = {dx: 311, dy: 607};

	public getWatermarkCoords() {
		return {
			dx: 264,
			dy: 735,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
