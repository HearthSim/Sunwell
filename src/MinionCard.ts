import Card from "./Card";

export default class MinionCard extends Card {
	public bodyTextColor = "black";
	public bodyTextSize = {width: 520, height: 290};
	public baseCardFrameAsset = "frame-minion-";
	public baseRarityGemAsset = "rarity-minion-";
	public nameBannerAsset = "name-banner-minion";
	public dragonAsset = "elite-minion";
	public dragonCoords = {dx: 196, dy: 0, dWidth: 529};
	public attackGemAsset = "attack-minion";
	public healthGemAsset = "health";
	public attackGemCoords = {
		sWidth: 214,
		sHeight: 238,
		dx: 0,
		dy: 862,
		dWidth: 214,
		dHeight: 238,
	};
	public attackTextCoords = {x: 128, y: 994};
	public healthGemCoords = {
		sWidth: 167,
		sHeight: 218,
		dx: 575,
		dy: 876,
		dWidth: 167,
		dHeight: 218,
	};
	public healthTextCoords = {x: 668, y: 994};
	public nameBannerCoords = {
		sWidth: 608,
		sHeight: 144,
		dx: 94,
		dy: 546,
		dWidth: 608,
		dHeight: 144,
	};
	public rarityGemCoords = {dx: 327, dy: 607};
	public nameTextCurve = {
		pathMiddle: 0.55,
		maxWidth: 560,
		curve: [{x: 0, y: 110}, {x: 122, y: 140}, {x: 368, y: 16}, {x: 580, y: 100}],
	};
	public artCoords = {
		sWidth: 461,
		sHeight: 461,
		dx: 105,
		dy: 100,
		dWidth: 461,
		dHeight: 461,
	};
	public artClipPolygon = [
		{"x": 335, "y": 102},
		{"x": 292, "y": 110},
		{"x": 256, "y": 131},
		{"x": 222, "y": 163},
		{"x": 195, "y": 203},
		{"x": 171, "y": 273},
		{"x": 163, "y": 330},
		{"x": 170, "y": 398},
		{"x": 200, "y": 474},
		{"x": 266, "y": 547},
		{"x": 302, "y": 563},
		{"x": 343, "y": 567},
		{"x": 406, "y": 544},
		{"x": 449, "y": 506},
		{"x": 488, "y": 432},
		{"x": 505, "y": 346},
		{"x": 494, "y": 255},
		{"x": 460, "y": 172},
		{"x": 425, "y": 135},
		{"x": 385, "y": 111},
	];

	public getWatermarkCoords() {
		let dy = 735;
		if (this.raceText) {
			dy -= 10; // Shift up
		}

		return {
			dx: 270,
			dy: dy,
			dWidth: 256,
			dHeight: 256,
		};
	}
}
