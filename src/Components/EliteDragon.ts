import Component from "./Component";

export default class EliteDragon extends Component {
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
