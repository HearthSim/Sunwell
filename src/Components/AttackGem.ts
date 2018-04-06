import Card from "../Card";
import Sunwell from "../Sunwell";
import Gem from "./Gem";

export default class AttackGem extends Gem {
	constructor(sunwell: Sunwell, parent: Card) {
		super(sunwell, parent);
		this.showGem = !parent.cardDef.hideStats;
		this.showText = !parent.cardDef.hideStats;
		this.gemAsset = parent.getAttackGemAsset();
		this.gemCoords = parent.getAttackGemCoords();
		this.text = parent.cardDef.attack.toString();
		this.textColor = parent.attackColor;
		this.textCoords = parent.getAttackTextCoords();
	}
}
