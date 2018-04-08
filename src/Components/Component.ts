import Card from "../Card";
import Sunwell from "../Sunwell";

export default class Component {
	protected sunwell: Sunwell;
	protected parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [];
	}
}
