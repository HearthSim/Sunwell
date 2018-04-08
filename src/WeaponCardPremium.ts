import WeaponCard from "./WeaponCard";

export default class WeaponCardPremium extends WeaponCard {
	public premium = true;
	public attackGemAsset = "attack-weapon-premium";
	public cardFoundationAsset = "base-weapon-premium";
	public cardFoundationCoords = {
		dx: 75,
		dy: 101,
		dWidth: 527,
		dHeight: 778,
		sWidth: 527,
		sHeight: 778,
	};
	public baseCardFrameAsset = "frame-weapon-premium-";
	public baseCardFrameCoords = {
		dx: 229,
		dy: 532,
		dWidth: 226,
		dHeight: 347,
		sWidth: 226,
		sHeight: 347,
	};
	public eliteDragonAsset = "elite-weapon-premium";
	public eliteDragonCoords = {
		dx: 197,
		dy: 63,
		dWidth: 420,
		dHeight: 247,
		sWidth: 420,
		sHeight: 247,
	};
	public healthGemAsset = "durability-premium";
	public nameBannerAsset = "name-banner-weapon-premium";
}
