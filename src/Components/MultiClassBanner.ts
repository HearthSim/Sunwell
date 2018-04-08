import {ICoords} from "../interfaces";
import Component from "./Component";

export default class MultiClassBanner extends Component {
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
