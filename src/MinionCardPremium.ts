import MinionCard from "./MinionCard";

export default class MinionCardPremium extends MinionCard {
	public premium = true;
	public bodyTextColor = "white";
	public cardFoundationAsset = "base-minion-premium";
	public cardFoundationCoords = {
		dx: 66,
		dy: 64,
		dwidth: 528,
		dheight: 818,
		swidth: 528,
		sheight: 818,
	};
	public baseCardFrameAsset = "frame-minion-premium-";
	public baseCardFrameCoords = {
		dx: 223,
		dy: 553,
		sWidth: 231,
		sHeight: 329,
		dWidth: 231,
		dHeight: 329,
	};
	public baseRarityGemAsset = "rarity-minion-premium-";
	public eliteDragonAsset = "elite-minion-premium";
	public eliteDragonCoords = {
		dx: 172,
		dy: 17,
		sWidth: 485,
		sHeight: 341,
		dWidth: 485,
		dHeight: 341,
	};
	public rarityGemCoords = {dx: 245, dy: 528};
	public nameBannerAsset = "name-banner-minion-premium";
	public attackGemAsset = "attack-minion-premium";
	public healthGemAsset = "health-premium";
	public raceBannerAsset = "race-banner-premium";
	public raceBannerCoords = {
		dx: 139,
		dy: 779,
		dWidth: 408,
		dHeight: 81,
		sWidth: 408,
		sHeight: 81,
	};
	public raceTextCoords = {dx: 347, dy: 826};
}
