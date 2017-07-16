import Card from "./Card";
import {CardClass, Rarity} from "./Enums";

export default class SpellCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 460, height: 290};
	public nameBannerAsset = "name-banner-spell";
	public attackGemAsset = null;
	public healthGemAsset = null;
	public attackGemCoords = null;
	public healthGemCoords = null;

	public getNameBannerCoords() {
		return {
			sWidth: 646,
			sHeight: 199,
			dx: 66,
			dy: 530,
			dWidth: 646,
			dHeight: 199,
		};
	}

	public getCardFrameAsset(cardClass) {
		return "frame-spell-" + CardClass[cardClass].toLowerCase();
	}

	public getRarityGemAsset(rarity) {
		return "rarity-spell-" + Rarity[rarity].toLowerCase();
	}

	public rarityGemCoords = {dx: 311, dy: 607};

	public getWatermarkCoords() {
		return {
			dx: 264,
			dy: 726,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
