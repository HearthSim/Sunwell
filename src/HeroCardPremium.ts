import HeroCard from "./HeroCard";

export default class HeroCardPremium extends HeroCard {
	public premium = true;
	public bodyTextColor = "white";
	public bodyTextCoords = {
		dx: 140,
		dy: 627,
		dWidth: 376,
		dHeight: 168,
		sWidth: 376,
		sHeight: 168,
	};
	public cardFoundationAsset = "base-hero-premium";
	public cardFoundationCoords = {
		dx: 66,
		dy: 84,
		dWidth: 527,
		dHeight: 799,
		sWidth: 527,
		sHeight: 799,
	};
	public baseCardFrameAsset = "frame-hero-premium-";
	public baseCardFrameCoords = {
		dx: 220,
		dy: 838,
		dWidth: 223,
		dHeight: 45,
		sWidth: 223,
		sHeight: 45,
	};
	public eliteDragonAsset = "elite-hero-premium";
	public nameBannerAsset = "name-banner-hero-premium";
	public nameBannerCoords = {
		dx: 87,
		dy: 456,
		dWidth: 490,
		dHeight: 122,
		sWidth: 490,
		sHeight: 122,
	};
	public rarityGemCoords = {dx: 307, dy: 528};
}
