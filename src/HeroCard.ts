import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class HeroCard extends Card {
	public getNameBannerAsset() {
		return "name-banner-hero";
	}

	public getNameBannerCoords() {
		return {
			sWidth: 627,
			sHeight: 156,
			dx: 81,
			dy: 535,
			dWidth: 627,
			dHeight: 156,
		};
	}

	public getCardFrameAsset(cardClass) {
		return "frame-hero-" + CardClass[cardClass].toLowerCase();
	}

	public getRarityGemAsset(rarity) {
		return "rarity-hero-" + Rarity[rarity].toLowerCase();
	}

	public rarityGemCoords = {dx: 327, dy: 607};

	public getWatermarkCoords() {
		return {
			dx: 270,
			dy: 735,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
