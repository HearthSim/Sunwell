import Component from "./Component";

export default class CardFrame extends Component {
	public assets(): string[] {
		return [this.parent.getCardFrameAsset()];
	}

	public render(context: CanvasRenderingContext2D, ratio: number): void {
		const coords = this.parent.baseCardFrameCoords;
		coords.ratio = ratio;
		this.sunwell.drawImage(context, this.parent.getCardFrameAsset(), coords);
	}
}
