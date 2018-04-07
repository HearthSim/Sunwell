import Card from "../Card";
import {ICoords} from "../interfaces";
import Sunwell from "../Sunwell";

export default class MultiClassBanner {
	private sunwell: Sunwell;
	private parent: Card;

	constructor(sunwell: Sunwell, parent: Card) {
		this.sunwell = sunwell;
		this.parent = parent;
	}

	public assets(): string[] {
		return [this.parent.getMultiClassBannerAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.parent.getMultiClassBannerAsset();
		if (!asset) {
			return;
		}
		const coords: ICoords = {
			dx: 50,
			dy: 119,
			ratio: ratio,
		};
		this.sunwell.drawImage(context, asset, coords);
	}
}
