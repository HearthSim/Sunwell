import HeroPowerCard from "./HeroPowerCard";

export default class HeroPowerCardPremium extends HeroPowerCard {
	public premium = true;
	public baseCardFrameAsset = "hero-power-premium-";
	public baseCardFrameCoords = {
		dx: 56,
		dy: 60,
		dWidth: 564,
		dHeight: 850,
		sWidth: 564,
		sHeight: 850,
	};
	public costTextCoords = {dx: 338, dy: 130};
}
