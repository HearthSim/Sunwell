const fs = require("fs");
const path = require("path");
const request = require("request");
const ArgumentParser = require("argparse").ArgumentParser;
const Canvas = require("canvas");
const Promise = require("promise");
const Sunwell = require("../dist/node-sunwell");


function NodePlatform() {
	this.name = "NODE";
	this.Image = Canvas.Image;
	this.Promise = Promise;
	// The notation "16px/1em" is not supported by node-canvas
	this.bodyFontSizeExtra = "";
	this.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}

NodePlatform.prototype.getBuffer = function(width, height, clear) {
	return new Canvas(width, height);
}

NodePlatform.prototype.freeBuffer = function(buffer) {}

NodePlatform.prototype.loadAsset = function(img, path, loaded, error) {
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

function renderCard(sunwell, card, path, resolution) {
	if (!card.type || !card.playerClass) {
		console.log("Skipping", card.id, "(No card to render)");
		return;
	}

	if (!fs.existsSync(card.texture)) {
		console.log("Skipping", card.id, "(Texture not found)", card.texture);
		return;
	}

	// Turn the texture into an image object
	fs.readFile(card.texture, function(err, data) {
		if (err) throw err;
		card.texture = new Canvas.Image();
		card.texture.src = data;

		let callback = function(canvas) {
			let out = fs.createWriteStream(path);
			let stream = canvas.pngStream();
			stream.on("data", (chunk) => { out.write(chunk); });
			stream.on("error", (chunk) => { console.log("Done rendering", path); });
			stream.on("error", (chunk) => { console.log("Error writing chunk", path); })
		}

		sunwell.createCard(card, resolution, null, callback);
	})
}


function drawFromJSON(sunwell, body, textureDir, outputDir, resolution) {
	const data = JSON.parse(body);
	for (i in data) {
		var card = data[i];
		var renderPath = path.join(outputDir, card.id + ".png");
		var textureName = card.id + ".jpg";
		var texturePath = path.join(textureDir, textureName);

		if (!fs.existsSync(renderPath)) {
			card.texture = texturePath;
			renderCard(sunwell, card, renderPath, resolution);
		}
	}
}

fonts = [
	{"path": "belwe/belwe-extrabold.ttf", "family": "Belwe"},
	{"path": "franklin-gothic/franklingothic-medcd.ttf", "family": "Franklin Gothic"},
]


function main() {
	var p = new ArgumentParser({
		"description": "Generate card renders",
	})
	p.addArgument("file", {"nargs": "+"});
	p.addArgument("--assets-dir", {"defaultValue": path.join(__dirname, "..", "src", "assets")});
	p.addArgument("--font-dir", {"defaultValue": path.join(__dirname, "fonts")});
	p.addArgument("--output-dir", {"defaultValue": path.join(__dirname, "out")});
	p.addArgument("--texture-dir", {"defaultValue": path.join(__dirname, "textures")});
	p.addArgument("--resolution", {"type": "int", "defaultValue": 512});
	var args = p.parseArgs();

	var sunwell = new Sunwell({
		titleFont: "Belwe",
		bodyFont: "Franklin Gothic",
		bodyFontSize: 42,
		bodyLineHeight: 55,
		bodyFontOffset: {x: 0, y: 30},
		assetFolder: args.assets_dir + "/",
		debug: false,
		platform: new NodePlatform(),
		cacheSkeleton: false,
	});

	for (let i in fonts) {
		let font = fonts[i];
		let fontPath = path.join(args.font_dir, font.path);
		if (!fs.existsSync(fontPath)) {
			console.log("WARNING: Font not found:", fontPath);
		} else {
			Canvas.registerFont(fontPath, {"family": font.family});
		}
	}


	for (let i in args.file) {
		let file = args.file[i];
		fs.readFile(file, function(err, data) {
			if (err) {
				console.log("Error reading", file, err);
				return;
			}
			drawFromJSON(sunwell, data, args.texture_dir, args.output_dir, args.resolution);
		});
	}
}

main();
