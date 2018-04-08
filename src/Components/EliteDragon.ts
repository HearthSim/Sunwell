import Card from "../Card";
import Sunwell from "../Sunwell";

export default class EliteDragon {
	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [this.parent.getEliteDragonAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.parent.getEliteDragonAsset();
		if (!asset) {
			return;
		}

		const coords = this.parent.eliteDragonCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, asset, coords);
	}
}
