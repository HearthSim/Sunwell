var Canvas = require("canvas")
  , Image = Canvas.Image;
var fs = require("fs");
var path = require("path")
var mkdirp = require("mkdirp");
var http = require("http");
const request = require("request");

var outputDirectory = process.cwd() + "/generated_images";
var jsonurl = "https://api.hearthstonejson.com/v1/latest/{lang}/cards.json";
var textureFolder = "../../512x";
var renderingWidth = 512;
var ids = null;

function usage() {
	console.log("node generate_images.js [lang1] [lang2] ...");
	console.log("options: ");
	console.log("        --jsonurl url: override the url where we fetch the json from.");
	console.log("        			The url must be a template that contains '{lang}' so we can replace it afterwards.");
	console.log('        			Defaults to "https://api.hearthstonejson.com/v1/latest/{lang}/cards.json"');
	console.log("        --textureFolder path: specify where the texture are located, relative to the folder of the generate_images.js script");
	console.log('        			Defaults to ../../512x');
	console.log("        --width pixels: rendering width for the cards");
	console.log('        			Defaults to 512');
	console.log("        --ids id1,id2: restrict rendering to the coma separated list of ids");
	process.exit();
}

langs = [];

for (var i = 2; i < process.argv.length; i++) {
	if (process.argv[i] == "--jsonurl") {
		if (i == process.argv.length - 1) {
			usage();
		}
		i++;
		jsonurl = process.argv[i];
	} else if (process.argv[i] == "--textureFolder") {
		if (i == process.argv.length - 1) {
			usage();
		}
		i++;
		textureFolder = process.argv[i];
	} else if (process.argv[i] == "--width") {
		if (i == process.argv.length - 1) {
			usage();
		}
		i++;
		width = process.argv[i] >> 0;
	} else if (process.argv[i] == "--ids") {
		if (i == process.argv.length - 1) {
			usage();
		}
		i++;
		ids = process.argv[i].split(",");
	} else {
		langs.push(process.argv[i]);
	}
}

if (langs.length == 0) {
	usage();
}

function loadFont(name, config) {
	var p = path.join(process.cwd(), "/fonts/", name);
	if (!fs.existsSync(p)) {
		console.log(p + " not found, skip font loading");
	} else {
		Canvas.registerFont(p, config);
	}
}

function NodePlatform() {

}

NodePlatform.prototype.getBuffer = function(width, height, clear) {
	return new Canvas(width, height)
}

NodePlatform.prototype.freeBuffer  = function(buffer) {
}

NodePlatform.prototype.loadAsset = function(img, url, loaded, error) {
	var p = __dirname + "/" + url;
	fs.readFile(p, function(err, data){
		if (err) {
			error();
			return;
		}
		img.src = data;
		loaded();
	});
}

sunwell = {
	settings: {
		titleFont: "Belwe-Medium",
		bodyFont: "ITC Franklin Gothic Std MedCd",
		bodyFontSize: 42,
		bodyLineHeight: 55,
		bodyFontOffset: {x: 0, y: 30},
		assetFolder: "/assets/",
		textureFolder: textureFolder,
		smallTextureFolder: "/smallArtworks/",
		autoInit: true,
		idAsTexture: true,
		debug: false,
		parallel: 256,
		platform: new NodePlatform()
	}
};

require("./sunwell");

function drawAllCards(json, dir) {
	for (var i = 0; i < json.length; i++) {
		var c = json[i];
		c.gameId = c.id;

		if (ids != null && ids.indexOf(c.id) == -1) {
			continue
		}

		var fileName = dir + "/card_" + c.gameId + ".png";
		if (!c.type || !c.playerClass) {
			// Skip
		} else if (!fs.existsSync(__dirname + "/" + sunwell.settings.textureFolder + "/" + c.gameId + ".jpg")) {
			// Skip
		} else if (!fs.existsSync(fileName)) {
			(function(c, i, fileName) {
				sunwell.createCard(c, renderingWidth, function(canvas) {
					var out = fs.createWriteStream(fileName)
					var stream = canvas.pngStream();

					stream.on("error", function(chunk) {
					  console.log("Error!");
					});

					stream.on("data", function(chunk) {
						out.write(chunk);
					});

					stream.on("end", function() {
						console.log("saved " + i + "/" + json.length + ": " + fileName);
						out.end();

						if (i == json.length - 1) {
							console.log("done");
						}
					});
				});
			})(c, i, fileName);
		}
	}
}


function generateLang(lang) {
	var dir = outputDirectory + "/" + lang;

	function downloadJson(url) {
		request(url, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				const j = JSON.parse(body)
				drawAllCards(j, dir);
			} else {
				console.log("Got an error while downloading json: ", url, ", status code: ", response.statusCode)
			}
		})
	}
	mkdirp(dir, function(err) {
		var url = jsonurl.replace("{lang}", lang);
		downloadJson(url);
	});
}

sunwell.init()

loadFont("belwe-medium.ttf", {family: "Belwe-Medium"});
loadFont("franklin-gothic.ttf", {family: "Franklin-Gothic"})

for (var i = 0; i < langs.length; i++) {
	generateLang(langs[i]);
}
