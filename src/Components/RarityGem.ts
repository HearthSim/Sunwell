import Component from "./Component";

export default class RarityGem extends Component {
	public assets(): string[] {
		return [this.parent.getRarityGemAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const asset = this.parent.getRarityGemAsset();
		if (!asset) {
			return;
		}
		const coords = this.parent.rarityGemCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, asset, coords);
	}
}
