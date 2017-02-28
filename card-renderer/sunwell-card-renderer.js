const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const request = require("request");
const ArgumentParser = require("argparse").ArgumentParser;
const Canvas = require("canvas");
const Promise = require("promise");
const Sunwell = require("../dist/sunwell").Sunwell;

function NodePlatform() {
	this.name = "NODE";
	this.Image = Canvas.Image;
	this.Promise = Promise;
	// The notation "16px/1em" is not supported by node-canvas
	this.bodyFontSizeExtra = "";
	this.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}

NodePlatform.prototype.getBuffer = function (width, height, clear) {
	return new Canvas(width, height);
}

NodePlatform.prototype.freeBuffer = function (buffer) {
}

NodePlatform.prototype.loadAsset = function (img, path, loaded, error) {
	fs.readFile(path, function (err, data) {
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

	if (card.type != "MINION" && card.type != "SPELL" && card.type != "WEAPON") {
		console.log("Skipping", card.id, "(Not a renderable card)");
		return;
	}

	if (!fs.existsSync(card.texture)) {
		console.log("Skipping", card.id, "(Texture not found)", card.texture);
		return;
	}

	// Turn the texture into an image object
	fs.readFile(card.texture, function (err, data) {
		if (err) throw err;
		card.texture = new Canvas.Image();
		card.texture.src = data;

		let callback = function (canvas) {
			let out = fs.createWriteStream(path);
			let stream = canvas.pngStream();
			stream.on("data", (chunk) => {
				out.write(chunk);
			});
			stream.on("end", (chunk) => {
				console.log("Done rendering", path);
			});
			stream.on("error", (chunk) => {
				console.log("Error writing chunk", path);
			})
		}

		sunwell.createCard(card, resolution, null, callback);
	})
}

function drawFromJSON(sunwell, body, textureDir, outputDir, resolution) {
	const data = JSON.parse(body);
	drawFromData(sunwell, data, textureDir, outputDir, resolution);
}

function drawFromData(sunwell, data, textureDir, outputDir, resolution) {
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

const fonts = {
	"belwe/belwe-extrabold.ttf": {family: "Belwe"},
	"franklin-gothic/franklingothic-medcd.ttf": {family: "Franklin Gothic"},
	"franklin-gothic-bold/franklingothic-demicd.ttf": {
		family: "Franklin Gothic Bold",
		weight: "bold",
	},
	"franklin-gothic-italic/franklingothic-medcdit.ttf": {
		family: "Franklin Gothic Italic",
		style: "italic",
	},
};

function main() {
	var p = new ArgumentParser({
		"description": "Generate card renders",
	});
	p.addArgument("file", {"nargs": "+"});
	p.addArgument("--assets-dir", {"defaultValue": path.resolve("..", "src", "assets")});
	p.addArgument("--font-dir", {"defaultValue": path.resolve("fonts")});
	p.addArgument("--output-dir", {"defaultValue": path.resolve("out")});
	p.addArgument("--texture-dir", {"defaultValue": path.resolve("textures")});
	p.addArgument("--resolution", {"type": "int", "defaultValue": 512});
	p.addArgument("--only", {"type": "string", "defaultValue": ""});
	p.addArgument("--debug", {"action": "storeTrue"});
	var args = p.parseArgs();
	var sunwell = new Sunwell({
		titleFont: "Belwe",
		bodyFont: (bold, italic) => "Franklin Gothic" + (bold ? " Bold" : italic ? " Italic" : ""),
		bodyFontSize: 52,
		bodyLineHeight: 60,
		bodyFontOffset: {x: 0, y: 50},
		assetFolder: path.resolve(args.assets_dir) + "/",
		debug: args.debug,
		platform: new NodePlatform(),
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

	const only = args.only.split(",").map((id) => id.trim());

	let outdir = path.resolve(args.output_dir);
	mkdirp.sync(outdir);

	for (let i in args.file) {
		let file = args.file[i];
		fs.readFile(file, function (err, body) {
			if (err) {
				console.log("Error reading", file, err);
				return;
			}
			let data = JSON.parse(body);
			if (only.length) {
				data = data.filter((card) => only.indexOf(card.id) !== -1);
			}
			drawFromData(sunwell, data, path.resolve(args.texture_dir), outdir, args.resolution);
		});
	}
}

main();
