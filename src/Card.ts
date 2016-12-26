import Sunwell from "./sunwell";


function checksum(o: Object): number {
	var s = "";
	var chk = 0x12345678;

	s = s + o["id"];
	s = s + o["playerClass"];
	s = s + o["rarity"];
	s = s + o["set"];
	s = s + o["elite"];
	s = s + o["silenced"];
	s = s + o["costHealth"];
	s = s + o["hideStats"];
	s = s + o["texture"];
	s = s + o["type"];
	s = s + o["width"];
	// Race text is rendered separately, we only need to know that it's displayed
	s = s + !!o["raceText"];

	for (var i = 0; i < s.length; i++) {
		chk += (s.charCodeAt(i) * (i + 1));
	}

	return chk;
}


export default class Card {
	public canvas;
	public target;

	constructor(sunwell: Sunwell, props, width: number, renderTarget) {
		var height = Math.round(width * 1.4397905759);

		if (!props) {
			throw new Error("No card properties given");
		}

		if (renderTarget) {
			if (typeof window === "undefined"|| renderTarget instanceof HTMLImageElement) {
				this.target = renderTarget;
			} else if (renderTarget instanceof HTMLCanvasElement) {
				this.canvas = renderTarget;
				this.canvas.width = width;
				this.canvas.height = height;
			}
		} else {
			this.target = new Image();
		}

		if (!this.canvas) {
			this.canvas = sunwell.options.platform.getBuffer(width, height, true)
		}

		props.costStyle = props.costStyle || "0";
		props.healthStyle = props.healthStyle || "0";
		props.attackStyle = props.attackStyle || "0";
		props.durabilityStyle = props.durabilityStyle || "0";
		props.silenced = props.silenced || false;
		props.costHealth = props.costHealth || false;
		props.width = width;
		props._cacheKey = checksum(props);

		sunwell.prepareRenderingCard(this, props);
	}
}
