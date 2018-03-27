import Card from "../Card";
import Sunwell from "../Sunwell";

export default class CardFrame {
	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [this.parent.getCardFrameAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.parent.baseCardFrameCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, this.parent.getCardFrameAsset(), coords);
	}
}
