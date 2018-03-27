import {contextBoundingBox} from "../helpers";
import {ICoords} from "../interfaces";
import Sunwell from "../Sunwell";

export default class RaceBanner {
	public asset: string;
	public coords: ICoords;
	public font: string;
	public text: string;
	public textCoords: ICoords;
	private sunwell: Sunwell;

	constructor(
		sunwell: Sunwell,
		asset: string,
		coords: ICoords,
		text: string,
		font: string,
		textCoords: ICoords
	) {
		this.sunwell = sunwell;
		this.asset = asset;
		this.coords = coords;
		this.text = text;
		this.font = font;
		this.textCoords = textCoords;
	}

	public render(context: CanvasRenderingContext2D, ratio: number) {
		const coords = this.coords;
		coords.ratio = ratio;

		// Draw the banner
		this.sunwell.drawImage(context, this.asset, coords);

		// Draw the text
		const buffer = this.sunwell.getBuffer(300, 60, true);
		const bufferCtx = buffer.getContext("2d");
		let x = 10;
		const text = this.text.split("");
		const textSize = 40;

		bufferCtx.font = textSize + "px " + this.font;
		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";
		bufferCtx.textAlign = "left";

		const xWidth = bufferCtx.measureText("x").width;
		for (const char of text) {
			bufferCtx.lineWidth = 7;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(char, x, 10);
			bufferCtx.strokeText(char, x, 10);

			bufferCtx.fillStyle = "white";
			bufferCtx.strokeStyle = "white";
			bufferCtx.lineWidth = 1;
			bufferCtx.fillText(char, x, 10);
			// context.strokeText(char, x, y);

			x += bufferCtx.measureText(char).width;
			x += xWidth * 0.1;
		}

		const b = contextBoundingBox(bufferCtx);

		context.drawImage(
			buffer,
			b.x,
			b.y,
			b.w,
			b.h,
			(this.textCoords.dx - b.w / 2) * ratio,
			(this.textCoords.dy - b.h / 2) * ratio,
			b.w * ratio,
			b.h * ratio
		);

		this.sunwell.freeBuffer(buffer);
	}
}
