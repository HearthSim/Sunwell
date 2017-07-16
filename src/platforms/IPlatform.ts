interface IPlatform {
	name: string;
	buffers: any[];
	Image: any;
	Promise: any;
	bodyFontSizeExtra: string;
	getBuffer(width: number, height: number, clear: boolean): void;
	freeBuffer(buffer): void;
	loadAsset(img, url, loaded, error): void;
	requestAnimationFrame(cb: () => void): void;
}

export default IPlatform;

export interface IPlatformConstructable {
	new (): IPlatform;
}
