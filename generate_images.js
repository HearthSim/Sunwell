var Canvas = require('canvas')
  , Image = Canvas.Image;
var fs = require("fs");
var path = require('path')
var mkdirp = require('mkdirp');
var http = require('http');
const request = require('request');

var outputDirectory = process.cwd() + "/generated_images";

function fontFile (name) {
  return path.join(process.cwd(), '/fonts/', name)
}

Canvas.registerFont(fontFile('belwe-medium.ttf'), {family: 'Belwe-Medium'})
Canvas.registerFont(fontFile('franklin-gothic.ttf'), {family: 'Franklin-Gothic'})

function NodePlatform() {

}

NodePlatform.prototype.getBuffer = function(width, height, clear) {
	return new Canvas(width, height)
}

NodePlatform.prototype.freeBuffer  = function(buffer) {
}

NodePlatform.prototype.loadAsset = function(img, url, loaded, error) {
	var p = __dirname + "/" + url;
	//console.log('loading ' + p);
	fs.readFile(p, function(err, data){
		if (err) {
			//console.log('error ' + url);
			error();
			return;
		}
		//console.log('loaded ' + url);
		img.src = data;
		loaded();
	});
}

sunwell = {
	settings: {
		titleFont: 'Belwe-Medium',
		bodyFont: 'ITC Franklin Gothic Std MedCd',
		bodyFontSize: 42,
		bodyLineHeight: 55,
		bodyFontOffset: {x: 0, y: 30},
		assetFolder: '/assets/',
		textureFolder: '../512x/',
		smallTextureFolder: '/smallArtworks/',
		autoInit: true,
		idAsTexture: true,
		debug: false,
		parallel: 256,
		platform: new NodePlatform()
	}
};

require('./sunwell');

var leeroy = {
	"language": "enUS",
	"title": "Leeroy Jenkins",
	"text": "<b>Charge</b>. <b>Battlecry:</b> Summon two 1/1 Whelps for your opponent.",
	"gameId": "EX1_116",
	"set": "EXPERT1",
	"cost": 5,
	"attack": 6,
	"health": 2,
	"rarity": "LEGENDARY",
	"type": "MINION",
	"collectible": "1",
	"playerClass": "NEUTRAL",
};

function drawAllCards(json, dir) {
	for (var i = 0; i < Math.min(json.length, 1000000); i++) {
		var c = json[i];
		c.gameId = c.id;
		
		if (true) {
			var fileName = dir + '/card_' + c.gameId + '.png';
			if (!c.type || !c.playerClass) {
				console.log("skip " + fileName);
			} else if (!fs.existsSync(__dirname + "/" + sunwell.settings.textureFolder + "/" + c.gameId + '.jpg')) {
				console.log("skip " + fileName);
			} else if (!fs.existsSync(fileName)) {
				console.log("queue " + fileName);
				(function(c, i, fileName) {
					sunwell.createCard(c, 512, function(canvas) {
						var out = fs.createWriteStream(fileName)
						var stream = canvas.pngStream();
						
						stream.on('error', function(chunk){
						  console.log("ouille");
						});

						stream.on('data', function(chunk){
							out.write(chunk);
						});

						stream.on('end', function(){
							console.log("saved " + i + "/" + json.length + ": " + fileName);
							out.end();
							
							if (i == json.length - 1) {
								console.log("done");
							}
						});
					});
				})(c, i, fileName);
			} else {
				//console.log("skip existing" + fileName);
			}
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
				console.log("Got an error: ", error, ", status code: ", response.statusCode)
			}
		})
	}
	mkdirp(dir, function(err) {
		downloadJson("https://api.hearthstonejson.com/v1/15590/" + lang + "/cards.json");
	});	
}

sunwell.init()

if (process.argv.length <3) {
	console.log("node generate_images.js [lang1] [lang2] ...");	
	process.exit();
}

for (var i = 2; i < process.argv.length; i++) {
	generateLang(process.argv[i]);
}
