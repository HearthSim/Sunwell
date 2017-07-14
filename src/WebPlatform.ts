/*var Platform = function() {
	this.name = "WEB";
	this.Image = Image;
	this.Promise = Promise;
	// The notation "16px/1em" is not supported by node-canvas
	this.bodyFontSizeExtra = "/1em";
}*/


export class WebPlatform {
	private buffers;
	public Image;

	constructor() {
		this.buffers = [];
		this.Image = Image;
	}

	public getBuffer(width: number, height: number, clear: boolean) {
		var cvs: HTMLCanvasElement;

		if (this.buffers.length) {
			if (width) {
				for (var i = 0; i < this.buffers.length; i++) {
					if (this.buffers[i].width === width && this.buffers[i].height === height) {
						cvs = this.buffers.splice(i, 1)[0];
						break;
					}
				}
			} else {
				cvs = this.buffers.pop();
			}
			if (cvs) {
				if (clear) {
					cvs.getContext("2d").clearRect(0, 0, cvs.width, cvs.height);
				}
				return cvs;
			}
		}

		cvs = document.createElement("canvas");

		if (width) {
			cvs.width = width;
			cvs.height = height;
		}

		return cvs;
	}

	public freeBuffer(buffer): void {
		this.buffers.push(buffer);
	}

	public loadAsset(img, url, loaded, error): void {
		img.addEventListener("load", loaded);
		img.addEventListener("error", error);
		img.src = url;
	}

	public requestAnimationFrame(cb) {
		return window.requestAnimationFrame(cb);
	}
}
