import Card from "../Card";
import {ICoords} from "../interfaces";
import Sunwell from "../Sunwell";

export default class Gem {
	public gemAsset: string;
	public showGem: boolean;
	public showText: boolean;
	public gemCoords: ICoords;
	public text: number;
	public textColor: string;
	public textCoords: ICoords;
	public textSize: number;

	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
		this.textSize = 124;
	}

	public assets(): string[] {
		return [this.gemAsset];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.gemAsset;
		if (!asset || !this.showGem) {
			return;
		}
		const coords = this.gemCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, asset, coords);

		if (!this.showText) {
			return;
		}
		const textCoords = this.textCoords;
		textCoords.ratio = ratio;

		this.parent.drawNumber(
			context,
			textCoords.dx,
			textCoords.dy,
			textCoords.ratio,
			this.text,
			this.textSize,
			this.textColor
		);
	}
}
