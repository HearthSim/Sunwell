interface IPlatform {
	name: string;
	buffers: Array<any>;
	Image: any;
	Promise: any;
	bodyFontSizeExtra: string;
	getBuffer(width: number, height: number, clear: boolean): void;
	freeBuffer(buffer): void;
	loadAsset(img, url, loaded, error): void;
	requestAnimationFrame(cb: Function): void;
}

export default IPlatform

export interface IPlatformConstructable {
	new(): IPlatform;
}
