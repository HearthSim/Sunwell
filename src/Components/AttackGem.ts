import Card from "../Card";
import Sunwell from "../Sunwell";

export default class AttackGem {
	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [this.parent.attackGemAsset];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.parent.attackGemAsset;
		if (!asset || this.parent.cardDef.hideStats) {
			return;
		}
		const coords = this.parent.attackGemCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, asset, coords);

		const textCoords = this.parent.attackTextCoords;
		textCoords.ratio = ratio;
		const textSize = 124;

		this.parent.drawNumber(
			context,
			textCoords.dx,
			textCoords.dy,
			textCoords.ratio,
			this.parent.cardDef.attack,
			textSize,
			this.parent.attackColor
		);
	}
}
