import Card from "../Card";
import Sunwell from "../Sunwell";

export default class CostGem {
	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [this.parent.getCostGemAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.parent.getCostGemAsset();
		if (!asset) {
			return;
		}
		const coords = this.parent.getCostGemCoords();
		coords.ratio = ratio;
		this.sunwell.drawImage(context, asset, coords);

		const textCoords = this.parent.costTextCoords;
		textCoords.ratio = ratio;
		const textSize = 130;

		this.parent.drawNumber(
			context,
			textCoords.dx,
			textCoords.dy,
			textCoords.ratio,
			this.parent.cardDef.cost,
			textSize,
			this.parent.costColor
		);
	}
}
