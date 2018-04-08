import SpellCard from "./SpellCard";

export default class SpellCardPremium extends SpellCard {
	public premium = true;
	public bodyTextColor = "white";
	public bodyTextCoords = {
		dx: 152,
		dy: 634,
		dWidth: 366,
		dHeight: 168,
		sWidth: 366,
		sHeight: 168,
	};
	public cardFoundationAsset = "base-spell-premium";
	public cardFoundationCoords = {
		dx: 52,
		dy: 125,
		dwidth: 580,
		dheight: 755,
		swidth: 580,
		sheight: 755,
	};
	public baseCardFrameAsset = "frame-spell-premium-";
	public baseCardFrameCoords = {
		dx: 220,
		dy: 126,
		sWidth: 226,
		sHeight: 754,
		dWidth: 226,
		dHeight: 754,
	};
	public baseRarityGemAsset = "rarity-spell-premium-";
	public eliteDragonAsset = "elite-spell-premium";
	public eliteDragonCoords = {
		dx: 185,
		dy: 91,
		dWidth: 476,
		dHeight: 259,
		sWidth: 476,
		sHeight: 259,
	};
	public nameBannerAsset = "name-banner-spell-premium";
	public nameBannerCoords = {
		dx: 84,
		dy: 464,
		dWidth: 497,
		dHeight: 152,
		sWidth: 497,
		sHeight: 152,
	};
	public nameTextCurve = {
		pathMiddle: 0.49,
		maxWidth: 450,
		curve: [{x: 10, y: 86}, {x: 170, y: 44}, {x: 294, y: 44}, {x: 450, y: 88}],
	};
	public rarityGemCoords = {
		dx: 283,
		dy: 545,
		dWidth: 107,
		dHeight: 74,
		sWidth: 107,
		sHeight: 74,
	};
}
