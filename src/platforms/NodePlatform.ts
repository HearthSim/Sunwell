import * as fs from "fs";
import * as Canvas from "canvas";

import IPlatform from "./IPlatform";

export default class NodePlatform implements IPlatform {
	name = "NODE";
	buffers = [];
	Image = Canvas.Image;
	Promise = Promise;
	// The notation "16px/1em" is not supported by node-canvas
	bodyFontSizeExtra = "";

	getBuffer(width: number, height: number, clear: boolean): void {
		return new Canvas(width, height);
	}

	freeBuffer(buffer: any): void {}

	loadAsset(img: any, path: any, loaded: any, error: any): void {
		fs.readFile(path, function(err, data) {
			if (err) {
				console.log("Error loading asset", path);
				error();
				return;
			}
			img.src = data;
			loaded();
		});
	}
	requestAnimationFrame(cb) {
		setImmediate(cb);
	}
}
