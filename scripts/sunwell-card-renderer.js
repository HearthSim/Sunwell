const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const request = require("request");
const {ArgumentParser} = require("argparse");
const Canvas = require("canvas");
const Promise = require("promise");
const Sunwell = require("../dist/sunwell.node");

function renderCard(sunwell, card, filePath, resolution, premium) {
	if (!card.type || !card.cardClass) {
		console.log("Skipping", card.id, "(no card to render)");
		return;
	}

	if (
		card.type !== "MINION" &&
		card.type !== "SPELL" &&
		card.type !== "WEAPON" &&
		card.type !== "HERO" &&
		card.type !== "HERO_POWER"
	) {
		console.log("Skipping", card.id, "(not a renderable card)");
		return;
	}

	if (!fs.existsSync(card.texture)) {
		console.log("Skipping", card.id, "(texture not found)", card.texture);
		return;
	}

	// Turn the texture into an image object
	fs.readFile(card.texture, function(err, data) {
		if (err) {
			throw err;
		}
		card.texture = new Canvas.Image();
		card.texture.src = data;

		let callback = function(canvas) {
			let out = fs.createWriteStream(filePath);
			let stream = canvas.pngStream();
			stream.on("data", chunk => {
				out.write(chunk);
			});
			stream.on("end", chunk => {
				console.log("Done rendering", filePath);
			});
			stream.on("error", chunk => {
				console.log("Error writing chunk", filePath);
			});
		};
		sunwell.createCard(card, resolution, premium, null, callback);
	});
}

function drawFromJSON(sunwell, body, textureDir, outputDir, resolution) {
	const data = JSON.parse(body);
	drawFromData(sunwell, data, textureDir, outputDir, resolution);
}

function drawFromData(sunwell, data, textureDir, outputDir, resolution, premium) {
	for (let i in data) {
		var card = data[i];
		card.key = i;
		var renderName = card.id + (premium ? "_premium" : "") + ".png";
		var renderPath = path.join(outputDir, renderName);
		var textureName = card.id + ".jpg";
		var texturePath = path.join(textureDir, textureName);

		if (!fs.existsSync(renderPath)) {
			card.texture = texturePath;
			renderCard(sunwell, card, renderPath, resolution, premium);
		}
	}
}

const fonts = {
	"belwe/belwe-extrabold.ttf": {family: "Belwe"},
	"franklin-gothic-bold/franklingothic-demicd.ttf": {
		family: "Franklin Gothic Bold",
		weight: "bold",
	},
	"franklin-gothic-italic/franklingothic-medcdit.ttf": {
		family: "Franklin Gothic Italic",
		style: "italic",
	},
	"franklin-gothic/franklingothic-medcd.ttf": {family: "Franklin Gothic"},
};

function main() {
	var p = new ArgumentParser({
		description: "Generate card renders",
	});
	p.addArgument("file", {nargs: "+"});
	p.addArgument("--assets-dir", {defaultValue: path.resolve("..", "src", "assets")});
	p.addArgument("--font-dir", {defaultValue: path.resolve("fonts")});
	p.addArgument("--output-dir", {defaultValue: path.resolve("out")});
	p.addArgument("--texture-dir", {defaultValue: path.resolve("textures")});
	p.addArgument("--resolution", {type: "int", defaultValue: 512});
	p.addArgument("--premium", {action: "storeTrue"});
	p.addArgument("--only", {type: "string", defaultValue: ""});
	p.addArgument("--debug", {action: "storeTrue"});
	var args = p.parseArgs();
	var sunwell = new Sunwell({
		titleFont: "Belwe",
		bodyFontBold: "Franklin Gothic Bold",
		bodyFontItalic: "Franklin Gothic Italic",
		bodyFontBoldItalic: "Franklin Gothic Bold Italic",
		bodyFontSize: 38,
		bodyLineHeight: 40,
		bodyFontOffset: {x: 0, y: 26},
		assetFolder: path.resolve(args.assets_dir) + "/",
		debug: args.debug,
		// platform: new NodePlatform(),
		cacheSkeleton: false,
	});

	for (let key of Object.keys(fonts)) {
		let font = fonts[key];
		let fontPath = path.join(args.font_dir, key);
		if (!fs.existsSync(fontPath)) {
			console.log("WARNING: Font not found:", fontPath);
		} else {
			Canvas.registerFont(fontPath, font);
		}
	}

	const only = args.only.split(",").map(id => id.trim());

	let outdir = path.resolve(args.output_dir);
	mkdirp.sync(outdir);

	for (let file of args.file) {
		fs.readFile(file, function(err, body) {
			if (err) {
				console.log("Error reading", file, err);
				return;
			}
			let data = JSON.parse(body);
			if (only.length && only[0].length) {
				data = data.filter(card => only.indexOf(card.id) !== -1);
			}
			drawFromData(sunwell, data, path.resolve(args.texture_dir), outdir, args.resolution, args.premium);
		});
	}
}

main();
