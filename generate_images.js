var Canvas = require('canvas')
  , Image = Canvas.Image;
var fs = require("fs");
var path = require('path')

console.log("hello");

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
	console.log('loading ' + p);
	fs.readFile(p, function(err, data){
		if (err) {
			console.log('error ' + url);
			error();
			return;
		}
		console.log('loaded ' + url);
		img.src = data;
		loaded();
	});
}

sunwell = {
	settings: {
		bodyFont: 'Franklin-Gothic',
		bodyFontSize: 42,
		bodyLineHeight: 55,
		bodyFontOffset: {x: 0, y: 30},
		assetFolder: '/assets/',
		textureFolder: '../512x/',
		smallTextureFolder: '/smallArtworks/',
		autoInit: true,
		idAsTexture: true,
		debug: true,
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

function drawCard(card) {
	sunwell.init()
	sunwell.createCard(leeroy, 512, function(canvas) {			
		var out = fs.createWriteStream(__dirname + '/card' + card.gameId + '.png')
		var stream = canvas.pngStream();
		
		stream.on('data', function(chunk){
			out.write(chunk);
		});

		stream.on('end', function(){
			console.log('saved png');
		});
	});	
}

drawCard(leeroy);
