import Card from "../Card";
import Sunwell from "../Sunwell";
import Gem from "./Gem";

export default class HealthGem extends Gem {
	constructor(sunwell: Sunwell, parent: Card) {
		super(sunwell, parent);
		this.showGem = !parent.cardDef.hideStats;
		this.showText = !parent.cardDef.hideStats;
		this.gemAsset = parent.getHealthGemAsset();
		this.gemCoords = parent.getHealthGemCoords();
		this.text = parent.cardDef.health.toString();
		this.textColor = parent.healthColor;
		this.textCoords = parent.getHealthTextCoords();
	}
}
