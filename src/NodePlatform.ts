import * as fs from "fs";
import Canvas from "canvas";


export class NodePlatform {
	public Image;

	constructor() {
		this.Image = Canvas.Image;
	}

	public getBuffer(width: number, height: number, clear: boolean) {
		return Canvas(width, height);
	}

	public freeBuffer(buffer): void {
	}

	public loadAsset(img, path, loaded, error): void {
		fs.readFile(path, function (err, data) {
			if (err) {
				console.log("Error loading asset", path);
				error();
				return;
			}
			img.src = data;
			loaded();
		});
	}

	public requestAnimationFrame(cb) {
		return setImmediate(cb);
	}
}
/*
function NodePlatform() {
	this.name = "NODE";
	this.Image = Canvas.Image;
	this.Promise = Promise;
	// The notation "16px/1em" is not supported by node-canvas
	this.bodyFontSizeExtra = "";
	this.requestAnimationFrame = (cb) => setImmediate(cb);
}
*/
