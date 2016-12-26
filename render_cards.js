#!/usr/bin/env node
const fs = require("fs");
const request = require("request");
const path = require("path");
const ArgumentParser = require("argparse").ArgumentParser;
const Canvas = require("canvas");
const Promise = require("promise");
const Sunwell = require("./sunwell");


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

sw = new Sunwell({
	titleFont: "Belwe",
	bodyFont: "Franklin Gothic",
	bodyFontSize: 42,
	bodyLineHeight: 55,
	bodyFontOffset: {x: 0, y: 30},
	assetFolder: path.join(__dirname, "./src/assets/"),
	debug: true,
	platform: new NodePlatform(),
	cacheSkeleton: false,
});

function renderCard(card, renderPath, renderWidth, resolution) {
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
		card.texture = new Canvas.Image;
		card.texture.src = data;

		sw.createCard(card, renderWidth, function(canvas) {
			var out = fs.createWriteStream(renderPath);
			var stream = canvas.pngStream();

			stream.on("error", function(chunk) {
				console.log("Error!");
			});

			stream.on("data", function(chunk) {
				out.write(chunk);
			});

			stream.on("end", function() {
				out.end();
				console.log("Rendered", renderPath);
			});
		});
	})
}


function drawFromJSON(body, textureDir, outputDir, resolution) {
	const data = JSON.parse(body);
	for (i in data) {
		var card = data[i];
		var renderPath = path.join(outputDir, card.id + ".png");
		var textureName = card.id + ".jpg";
		var texturePath = path.join(textureDir, textureName);

		if (!fs.existsSync(renderPath)) {
			card.texture = texturePath;
			renderCard(card, renderPath, resolution);
		}
	}
}


var parser = new ArgumentParser({
	"description": "Generate card renders",
})
parser.addArgument("file", {"nargs": "+"});
parser.addArgument("--font-dir", {"defaultValue": path.join(__dirname, "fonts")});
parser.addArgument("--output-dir", {"defaultValue": path.join(__dirname, "out")});
parser.addArgument("--texture-dir", {"defaultValue": path.join(__dirname, "textures")});
parser.addArgument("--resolution", {"type": "int", "defaultValue": 512})
var args = parser.parseArgs();


fonts = [
	{"path": "belwe/belwe-extrabold.ttf", "family": "Belwe"},
	{"path": "franklin-gothic/franklingothic-medcd.ttf", "family": "Franklin Gothic"},
]

for (var i in fonts) {
	var font = fonts[i];
	var fontPath = path.join(args.font_dir, font.path);
	if (!fs.existsSync(fontPath)) {
		console.log("WARNING: Font not found:", fontPath);
	} else {
		Canvas.registerFont(fontPath, {"family": font.family});
	}
}


for (var i in args.file) {
	var file = args.file[i];
	fs.readFile(file, function(err, data) {
		if (err) {
			console.log("Error reading", file, err);
			return;
		}
		drawFromJSON(data, args.texture_dir, args.output_dir, args.resolution);
	});
}
