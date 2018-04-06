import Card from "../Card";
import Sunwell from "../Sunwell";
import Gem from "./Gem";

export default class CostGem extends Gem {
	constructor(sunwell: Sunwell, parent: Card) {
		super(sunwell, parent);
		this.showGem = true;
		this.showText = !parent.cardDef.hideStats;
		this.gemAsset = parent.getCostGemAsset();
		this.gemCoords = parent.getCostGemCoords();
		this.text = parent.cardDef.cost.toString();
		this.textColor = parent.costColor;
		this.textCoords = parent.getCostTextCoords();
		this.textSize = 130;
	}
}
