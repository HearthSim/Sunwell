import IPlatform from "./IPlatform";

export default class WebPlatform implements IPlatform {
	name = "WEB";
	buffers = [];
	Image = Image;
	Promise = Promise;
	bodyFontSizeExtra = "/1em";

	getBuffer(width: number, height: number, clear: boolean): void {
		var cvs;
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

	freeBuffer(buffer: any): void {
		this.buffers.push(buffer);
	}

	loadAsset(img: any, url: any, loaded: any, error: any): void {
		img.addEventListener("load", loaded);
		img.addEventListener("error", error);
		img.src = url;
	}

	requestAnimationFrame(cb) {
		window.requestAnimationFrame(cb);
	}
}
