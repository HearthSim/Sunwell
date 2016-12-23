/**
 * Sunwell
 * =======
 * Sunwell is a renderer for hearthstone cards.
 *
 * @author Christian Engel <hello@wearekiss.com>
 */
if (typeof window == "undefined") {
	var Promise = require("promise");
	var Canvas = require("canvas")
	, Image = Canvas.Image;
}

(function () {
	"use strict";

	var sunwell,
		assets = {},
		assetListeners = {},
		ready = false,
		renderQuery = [],
		rendering = 0,
		renderCache = {};

	var CardClass = {
		INVALID: 0,
		DEATHKNIGHT: 1,
		DRUID: 2,
		HUNTER: 3,
		MAGE: 4,
		PALADIN: 5,
		PRIEST: 6,
		ROGUE: 7,
		SHAMAN: 8,
		WARLOCK: 9,
		WARRIOR: 10,
		DREAM: 11,
		NEUTRAL: 12,
	}

	var CardType = {
		INVALID: 0,
		HERO: 3,
		MINION: 4,
		SPELL: 5,
		WEAPON: 7,
		HERO_POWER: 10,
	}

	var CardSet = {
		INVALID: 0,
		CORE: 2,
		EXPERT1: 3,
		NAXX: 12,
		GVG: 13,
		BRM: 14,
		TGT: 15,
		LOE: 20,
		KARA: 23,
		OG: 21,
		GANGS: 25,
	}

	var Race = {
		INVALID: 0,
		MURLOC: 14,
		DEMON: 15,
		MECHANICAL: 17,
		PET: 20,
		BEAST: 20,
		TOTEM: 21,
		PIRATE: 23,
		DRAGON: 24,
	}

	var Rarity = {
		INVALID: 0,
		COMMON: 1,
		FREE: 2,
		RARE: 3,
		EPIC: 4,
		LEGENDARY: 5,
	}

	var MultiClassGroup = {
		INVALID: 0,
		GRIMY_GOONS: 1,
		JADE_LOTUS: 2,
		KABAL: 3,
	}

	function lookup(obj, value) {
		return Object.keys(obj).find(key => obj[key] === value);
	}

	function log(msg) {
		if (!sunwell.settings.debug) {
			return;
		}
		console.log(msg);
	}

	var bodyFontSizeExtra = "/1em";
	if (typeof window == "undefined") {
		// we run in node-canvas and we dont support ctx.font="16px/1em" notation
		bodyFontSizeExtra = "";
	}

	function WebPlatform() {
		this.buffers = [];
	}

	/**
	 * Returns a new render buffer (canvas).
	 * @returns {*}
	 */
	WebPlatform.prototype.getBuffer = function(width, height, clear) {
		var cvs;

		if (this.buffers.length) {
			if (width) {
				for (var i = 0; i < this.buffers.length; i++) {
					if (this.buffers[i].width === width && this.buffers[i].height === height) {
						cvs = this.buffers.splice(i, 1)[0];
						break;
					}
				}
			} else {
				cvs = this.buffers.pop();
			}
			if (cvs) {
				if (clear) {
					cvs.getContext("2d").clearRect(0, 0, cvs.width, cvs.height);
				}
				return cvs;
			}
		}

		cvs = document.createElement("canvas");

		if (width) {
			cvs.width = width;
			cvs.height = height;
		}

		return cvs;
	}

	/**
	 * Makes a new render buffer available for recycling.
	 * @param buffer
	 */
	WebPlatform.prototype.freeBuffer = function(buffer) {
		this.buffers.push(buffer);
	}

	WebPlatform.prototype.loadAsset = function(img, url, loaded, error) {
		img.addEventListener("load", loaded);
		img.addEventListener("error", error);

		img.src = url;
	}

	function getAsset(id) {
		return assets[id];
	}

	function getWatermarkAsset(set) {
		var watermarks = {}
		watermarks[CardSet.EXPERT1] = "set-classic"
		watermarks[CardSet.NAXX] = "set-naxx"
		watermarks[CardSet.GVG] = "set-gvg"
		watermarks[CardSet.BRM] = "set-brm"
		watermarks[CardSet.TGT] = "set-tgt"
		watermarks[CardSet.LOE] = "set-loe"
		watermarks[CardSet.OG] = "set-og"
		watermarks[CardSet.KARA] = "set-kara"
		watermarks[CardSet.GANGS] = "set-gangs"

		if (set in watermarks) {
			return watermarks[set]
		}
	}

	if (typeof window != "undefined") {
		sunwell = window.sunwell || {};
	} else {
		sunwell = global.sunwell;
	}

	sunwell._renderQuery = renderQuery;
	sunwell._activeRenders = rendering;

	sunwell.settings = sunwell.settings || {};

	sunwell.settings.titleFont = sunwell.settings.titleFont || "Belwe Bold";
	sunwell.settings.bodyFont = sunwell.settings.bodyFont || "ITC Franklin Condensed";
	sunwell.settings.bodyFontSize = sunwell.settings.bodyFontSize || 60;
	sunwell.settings.bodyFontOffset = sunwell.settings.bodyFontOffset || {x: 0, y: 0};
	sunwell.settings.bodyLineHeight = sunwell.settings.bodyLineHeight || 50;
	sunwell.settings.assetFolder = sunwell.settings.assetFolder || "/assets/";
	sunwell.settings.autoInit = sunwell.settings.autoInit || true;
	sunwell.settings.platform = sunwell.settings.platform || new WebPlatform();
	var maxRendering = sunwell.settings.maxRendering || 12;

	sunwell.settings.debug = sunwell.settings.debug || false;

	sunwell.init = function () {
		ready = true;
		if (renderQuery.length) {
			renderTick();
		}
	};
	if (!sunwell.settings.autoInit) {
		sunwell.init();
	}

	sunwell.races = {}
	sunwell.races[Race.MURLOC] = {"enUS": "Murloc"};
	sunwell.races[Race.MECHANICAL] = {"enUS": "Mech"};
	sunwell.races[Race.BEAST] = {"enUS": "Beast"};
	sunwell.races[Race.DEMON] = {"enUS": "Demon"};
	sunwell.races[Race.PIRATE] = {"enUS": "Pirate"};
	sunwell.races[Race.DRAGON] = {"enUS": "Dragon"};
	sunwell.races[Race.TOTEM] = {"enUS": "Totem"};

	/**
	 * Calculate the checksum for an object.
	 * @param o
	 * @returns {number}
	 */
	function checksum(o) {
		var i, key, s = "";
		var chk = 0x12345678;

		s = s + o["gameId"];
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

		for (i = 0; i < s.length; i++) {
			chk += (s.charCodeAt(i) * (i + 1));
		}

		return chk;
	}

	/**
	 * Helper function to draw the oval mask for the cards artwork.
	 * @param ctx
	 * @param x
	 * @param y
	 * @param w
	 * @param h
	 */
	function drawEllipse(ctx, x, y, w, h) {
		var kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w, // x-end
			ye = y + h, // y-end
			xm = x + w / 2, // x-middle
			ym = y + h / 2; // y-middle

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		//ctx.closePath(); // not used correctly, see comments (use to close off open path)
		ctx.stroke();
	}

	/**
	 * Preloads the basic card assets.
	 * You can call this before you start to render any cards, but you don"t have to.
	 */
	function fetchAssets(loadAssets) {
		return new Promise(function (resolve, reject) {
			var loaded = 0,
				loadingTotal = 0,
				result = {},
				key,
				isTexture,
				isUrl,
				srcURL;

			for (var i = 0; i < loadAssets.length; i++) {
				key = loadAssets[i];
				isTexture = false;

				if (key.substr(0, 2) === "h:") {
					isTexture = true;
					key = key.substr(2);
				}

				if (key.substr(0, 2) === "t:") {
					isTexture = true;
					key = key.substr(2);
					if (assets[key] !== undefined) {
						if (assets[key].width === 256) {
							assets[key] = undefined;
						}
					}
				}

				if (assets[key] === undefined) {
					assets[key] = new Image();
					assets[key].crossOrigin = "Anonymous";
					assets[key].loaded = false;
					loadingTotal++;

					if (isTexture) {
						assets[key].isTexture = true;
						srcURL = key;
					} else {
						srcURL = sunwell.settings.assetFolder + key + ".png";
					}
					log("Requesting " + srcURL);

					(function(key) {
						function completeCB() {
							loaded++;
							assets[key].loaded = true;
							if (loaded >= loadingTotal) {
								resolve(result);
							}
							if (assetListeners[key]) {
								for (var a in assetListeners[key]) {
									assetListeners[key][a](assets[key]);
								}
								delete assetListeners[key]
							}
						}
						function loadedCB() {
							result[key] = assets[key];
							completeCB();
						}
						function errorCB() {
							completeCB();
						}
						sunwell.settings.platform.loadAsset(assets[key], srcURL, loadedCB, errorCB);
					})(key);
				} else {
					loadingTotal++;
					if (assets[key].loaded) {
						loaded++;
						result[key] = assets[key];
					} else {
						assetListeners[key] = assetListeners[key] || []
						assetListeners[key].push(function(a) {
							loaded++;
							result[key] = a;
							if (loaded >= loadingTotal) {
								resolve(result);
							}
						});
					}
				}
			}

			if (loaded > 0 && loaded >= loadingTotal) {
				resolve(result);
			}
		});
	}

	/**
	 * Get the bounding box of a canvas" content.
	 * @param ctx
	 * @param alphaThreshold
	 * @returns {{x: *, y: *, maxX: (number|*|w), maxY: *, w: number, h: number}}
	 */
	function contextBoundingBox(ctx) {
		var w = ctx.canvas.width, h = ctx.canvas.height;
		var data = ctx.getImageData(0, 0, w, h).data;
		var x, y, minX = 999, minY = 999, maxX = 0, maxY = 0;

		var out = false;

		for (y = h - 1; y > -1; y--) {
			if (out) {
				break;
			}
			for (x = 0; x < w; x++) {
				if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
					maxY = Math.max(maxY, y);
					out = true;
					break;
				}
			}
		}

		if (maxY === undefined) {
			return null;
		}

		out2:
			for (x = w - 1; x > -1; x--) {
				for (y = 0; y < h; y++) {
					if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
						maxX = Math.max(maxX, x);
						break out2;
					}
				}
			}

		out3:
			for (x = 0; x < maxX; x++) {
				for (y = 0; y < h; y++) {
					if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
						minX = Math.min(x, minX);
						break out3;
					}
				}
			}

		out4:
			for (y = 0; y < maxY; y++) {
				for (x = 0; x < w; x++) {
					if (data[((y * (w * 4)) + (x * 4)) + 3] > 0) {
						minY = Math.min(minY, y);
						break out4;
					}
				}
			}

		return {x: minX, y: minY, maxX: maxX, maxY: maxY, w: maxX - minX, h: maxY - minY};
	}

	function getRaceText(race, lang) {
		if (race in sunwell.races) {
			return sunwell.races[race]["enUS"];
		}
		return "";
	}

	function renderRaceText(targetCtx, s, card) {
		var x;

		var buffer = sunwell.settings.platform.getBuffer();
		var bufferCtx = buffer.getContext("2d");

		buffer.width = 300;
		buffer.height = 60;

		bufferCtx.font = "45px " + sunwell.settings.titleFont;

		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";

		bufferCtx.textAlign = "left";

		var text = card.raceText.split("");

		x = 10;

		for (var i = 0; i < text.length; i++) {
			bufferCtx.lineWidth = 8;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(text[i], x, 10);
			bufferCtx.strokeText(text[i], x, 10);

			bufferCtx.fillStyle = "white";
			bufferCtx.strokeStyle = "white";
			bufferCtx.lineWidth = 1;
			bufferCtx.fillText(text[i], x, 10);
			//ctx.strokeText(text[i], x, y);

			x += bufferCtx.measureText(text[i]).width;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (394 - (b.w / 2)) * s, (1001 - (b.h / 2)) * s, b.w * s, b.h * s);

		sunwell.settings.platform.freeBuffer(buffer);
	}

	/**
	 * Renders a given number to the defined position.
	 * The x/y position should be the position on an unscaled card.
	 *
	 * @param targetCtx
	 * @param x
	 * @param y
	 * @param s
	 * @param number
	 * @param size
	 * @param [drawStyle="0"] Either "+", "-" or "0". Default: "0"
	 */
	function drawNumber(targetCtx, x, y, s, number, size, drawStyle) {
		var buffer = sunwell.settings.platform.getBuffer();
		var bufferCtx = buffer.getContext("2d");

		if (drawStyle === undefined) {
			drawStyle = "0";
		}

		buffer.width = 256;
		buffer.height = 256;

		number = number.toString();

		number = number.split("");

		var tX = 10;

		bufferCtx.font = size + "px " + sunwell.settings.titleFont;

		bufferCtx.lineCap = "round";
		bufferCtx.lineJoin = "round";
		bufferCtx.textBaseline = "hanging";

		bufferCtx.textAlign = "left";

		var color = "white";

		if (drawStyle === "-") {
			color = "#f00";
		}

		if (drawStyle === "+") {
			color = "#0f0";
		}

		for (var i = 0; i < number.length; i++) {
			bufferCtx.lineWidth = 13;
			bufferCtx.strokeStyle = "black";
			bufferCtx.fillStyle = "black";
			bufferCtx.fillText(number[i], tX, 10);
			bufferCtx.strokeText(number[i], tX, 10);

			bufferCtx.fillStyle = color;
			bufferCtx.strokeStyle = color;
			bufferCtx.lineWidth = 2.5;
			bufferCtx.fillText(number[i], tX, 10);
			//ctx.strokeText(text[i], x, y);

			tX += bufferCtx.measureText(number[i]).width;
		}

		var b = contextBoundingBox(bufferCtx);

		targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (x - (b.w / 2)) * s, (y - (b.h / 2)) * s, b.w * s, b.h * s);

		sunwell.settings.platform.freeBuffer(buffer);
	}

	/**
	 * Finishes a text line and starts a new one.
	 * @param bufferTextCtx
	 * @param bufferRow
	 * @param bufferRowCtx
	 * @param xPos
	 * @param yPos
	 * @param totalWidth
	 * @returns {*[]}
	 */
	function finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, totalWidth) {
		if (sunwell.settings.debug) {
			bufferTextCtx.save();
			bufferTextCtx.strokeStyle = "red";
			bufferTextCtx.beginPath();
			bufferTextCtx.moveTo((totalWidth / 2) - (xPos / 2), yPos);
			bufferTextCtx.lineTo((totalWidth / 2) + (xPos / 2), yPos);
			bufferTextCtx.stroke();
			bufferTextCtx.restore();
		}

		var xCalc = (totalWidth / 2) - (xPos / 2);

		if (xCalc < 0) {
			xCalc = 0;
		}

		if (xPos > 0 && bufferRow.width > 0) {
			bufferTextCtx.drawImage(
				bufferRow,
				0,
				0,
				xPos > bufferRow.width ? bufferRow.width : xPos,
				bufferRow.height,
				xCalc,
				yPos,
				Math.min(xPos, bufferRow.width),
				bufferRow.height
			);
		}

		xPos = 5;
		yPos += bufferRow.height;
		bufferRowCtx.clearRect(0, 0, bufferRow.width, bufferRow.height);

		return [xPos, yPos];
	}

	/**
	 * Renders the HTML body text of a card.
	 * @param targetCtx
	 * @param s
	 * @param card
	 */
	function drawBodyText(targetCtx, s, card, forceSmallerFirstLine) {
		var cardText = card.text;

		if (!cardText) {
			return;
		}
		if (card.collectionText) {
			cardText = card.collectionText;
		}

		var manualBreak = cardText.substr(0, 3) === "[x]",
			bufferText = sunwell.settings.platform.getBuffer(),
			bufferTextCtx = bufferText.getContext("2d"),
			bufferRow = sunwell.settings.platform.getBuffer(),
			bufferRowCtx = bufferRow.getContext("2d"),
			bodyText = manualBreak ? cardText.substr(3) : cardText,
			words,
			word,
			chars,
			char,
			width,
			spaceWidth,
			xPos = 0,
			yPos = 0,
			isBold = 0,
			isItalic = 0,
			i,
			j,
			r,
			centerLeft,
			centerTop,
			justLineBreak,
			lineCount = 0,
			plurals,
			pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g,
			pBodyText;

		pBodyText = bodyText;
		while ((plurals = pluralRegex.exec(bodyText)) !== null) {
			pBodyText = pBodyText.replace(plurals[0], plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4]));
		}
		bodyText = pBodyText;

		words = bodyText.replace(/[\$#_]/g, "").split(/( |\n)/g);

		log("Rendering body: " + bodyText);

		centerLeft = 390;
		centerTop = 860;
		bufferText.width = 520;
		bufferText.height = 290;

		bufferRow.width = 520;

		if (card.type === CardType.SPELL) {
			bufferText.width = 460;
			bufferText.height = 290;

			bufferRow.width = 460;
		}

		if (card.type === CardType.WEAPON) {
			bufferText.width = 470;
			bufferText.height = 250;

			bufferRow.width = 470;
		}

		var fontSize = sunwell.settings.bodyFontSize;
		var lineHeight = sunwell.settings.bodyLineHeight;
		var totalLength = cardText.replace(/<\/*.>/g, "").length;
		var smallerFirstLine = false;

		if (totalLength >= 80) {
			fontSize = sunwell.settings.bodyFontSize * 0.9;
			lineHeight = sunwell.settings.bodyLineHeight * 0.9;
		}

		if (totalLength >= 100) {
			fontSize = sunwell.settings.bodyFontSize * 0.8;
			lineHeight = sunwell.settings.bodyLineHeight * 0.8;
		}

		bufferRow.height = lineHeight;

		if (totalLength >= 75 && card.type === CardType.SPELL) {
			smallerFirstLine = true;
		}

		if (forceSmallerFirstLine) {
			smallerFirstLine = true;
		}

		if (card.type === CardType.WEAPON) {
			bufferRowCtx.fillStyle = "#fff";
		} else {
			bufferRowCtx.fillStyle = "#000";
		}

		bufferRowCtx.textBaseline = sunwell.settings.bodyBaseline;

		bufferRowCtx.font = fontSize + "px" + bodyFontSizeExtra + " '" + sunwell.settings.bodyFont + "', sans-serif";

		spaceWidth = 3;

		var getFontMaterial = function() {
			return (isBold > 0 ? "bold " : "") + (isItalic > 0 ? "italic " : "") + fontSize + "px" + bodyFontSizeExtra + " '" + sunwell.settings.bodyFont + "', sans-serif";
		}

		for (i = 0; i < words.length; i++) {
			word = words[i];

			chars = word.split("");

			width = bufferRowCtx.measureText(word).width;
			log("Next word: " + word);

			if (!manualBreak && (xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8))) {
				log((xPos + width) + " > " + bufferRow.width);
				log("Calculated line break");
				smallerFirstLine = false;
				lineCount++;
				r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
				xPos = r[0];
				yPos = r[1];
				justLineBreak = true;
			}

			for (j = 0; j < chars.length; j++) {
				char = chars[j];

				if (char === "\n") {
					if (justLineBreak) {
						justLineBreak = false;
						continue;
					}
					lineCount++;
					r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
					xPos = r[0];
					yPos = r[1];
					log("Manual line break");
					continue;
				}

				justLineBreak = false;

				// <b>
				if (char === "<" && chars[j + 1] === "b" && chars[j + 2] === ">") {
					isBold++;
					j += 2;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// </b>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "b" && chars[j + 3] === ">") {
					isBold--;
					j += 3;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// <i>
				if (char === "<" && chars[j + 1] === "i" && chars[j + 2] === ">") {
					isItalic++;
					j += 2;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				// </i>
				if (char === "<" && chars[j + 1] === "/" && chars[j + 2] === "i" && chars[j + 3] === ">") {
					isItalic--;
					j += 3;
					bufferRowCtx.font = getFontMaterial();
					continue;
				}

				bufferRowCtx.fillText(char, xPos + sunwell.settings.bodyFontOffset.x, sunwell.settings.bodyFontOffset.y);

				xPos += bufferRowCtx.measureText(char).width + (spaceWidth / 8);
			}

			xPos += spaceWidth;
		}

		lineCount++;
		finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);

		sunwell.settings.platform.freeBuffer(bufferRow);

		if (card.type === CardType.SPELL && lineCount === 4) {
			if (!smallerFirstLine && !forceSmallerFirstLine) {
				drawBodyText(targetCtx, s, card, true);
				return;
			}
		}

		var b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		targetCtx.drawImage(bufferText, b.x, b.y - 2, b.w, b.h, (centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);

		sunwell.settings.platform.freeBuffer(bufferText);

		if (sunwell.settings.debug) {
			targetCtx.save();
			targetCtx.strokeStyle = "green";
			targetCtx.beginPath();
			targetCtx.rect((centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);
			targetCtx.stroke();
			targetCtx.strokeStyle = "red";
			targetCtx.beginPath();
			targetCtx.rect((centerLeft - (bufferText.width / 2)) * s, (centerTop - (bufferText.height / 2)) * s, bufferText.width * s, (bufferText.height + 2) * s);
			targetCtx.stroke();
			targetCtx.restore();
		}
	}

	/**
	 * Given a curve and t, the function returns the point on the curve.
	 * r is the rotation of the point in radians.
	 * @param curve
	 * @param t
	 * @returns {{x: (number|*), y: (number|*), r: number}}
	 */
	function getPointOnCurve(curve, t) {

		var rX, rY, x, y;

		rX = 3 * Math.pow(1 - t, 2) * (curve[1].x - curve[0].x) + 6 * (1 - t) * t * (curve[2].x - curve[1].x) + 3 * Math.pow(t, 2) * (curve[3].x - curve[2].x);
		rY = 3 * Math.pow(1 - t, 2) * (curve[1].y - curve[0].y) + 6 * (1 - t) * t * (curve[2].y - curve[1].y) + 3 * Math.pow(t, 2) * (curve[3].y - curve[2].y);

		x = Math.pow((1 - t), 3) * curve[0].x + 3 * Math.pow((1 - t), 2) * t * curve[1].x + 3 * (1 - t) * Math.pow(t, 2) * curve[2].x + Math.pow(t, 3) * curve[3].x;
		y = Math.pow((1 - t), 3) * curve[0].y + 3 * Math.pow((1 - t), 2) * t * curve[1].y + 3 * (1 - t) * Math.pow(t, 2) * curve[2].y + Math.pow(t, 3) * curve[3].y;

		return {
			x: x,
			y: y,
			r: Math.atan2(rY, rX)
		}
	}

	/**
	 * Draw the Card name
	 */
	function drawCardName(targetCtx, s, card) {
		var buffer = sunwell.settings.platform.getBuffer();
		var name = card.name;
		buffer.width = 1024;
		buffer.height = 200;
		var ctx = buffer.getContext("2d");
		var boundaries;
		ctx.save();

		var pathMiddle = .58;
		var maxWidth = 580;

		// Path midpoint at t = 0.56
		var c = [
			{x: 0, y: 110},
			{x: 102, y: 137},
			{x: 368, y: 16},
			{x: 580, y: 100}
		];

		if (card.type === CardType.SPELL) {
			pathMiddle = .52;
			maxWidth = 580;
			c = [
				{x: 10, y: 100},
				{x: 212, y: 35},
				{x: 368, y: 35},
				{x: 570, y: 105}
			]
		}

		if (card.type === CardType.WEAPON) {
			pathMiddle = .58;
			maxWidth = 580;
			c = [
				{x: 10, y: 75},
				{x: 50, y: 75},
				{x: 500, y: 75},
				{x: 570, y: 75}
			]
		}

		var fontSize = 51;

		ctx.lineWidth = 13;
		ctx.strokeStyle = "black";

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		var textWidth = maxWidth + 1;
		var steps,
			begin;

		while (textWidth > maxWidth && fontSize > 10) {
			fontSize -= 1;
			ctx.font = fontSize + "px " + sunwell.settings.titleFont;
			textWidth = 0;
			for (var i = 0; i < name.length; i++) {
				textWidth += ctx.measureText(name[i]).width + 2;
			}

			textWidth *= 1.25;
		}

		textWidth = textWidth / maxWidth;
		begin = pathMiddle - (textWidth / 2);
		steps = textWidth / name.length;

		if (sunwell.settings.debug) {
			ctx.save();
			ctx.strokeStyle = "red";
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.moveTo(c[0].x, c[0].y);
			ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);
			ctx.stroke();
			ctx.restore();
		}

		var p, t, leftPos = 0, m;
		for (i = 0; i < name.length; i++) {
			if (leftPos === 0) {
				t = begin + (steps * i);
				p = getPointOnCurve(c, t);
				leftPos = p.x;
			} else {
				t += 0.01;
				p = getPointOnCurve(c, t);
				while (p.x < leftPos) {
					t += 0.001;
					p = getPointOnCurve(c, t);
				}
			}

			ctx.save();
			ctx.translate(p.x, p.y);

			ctx.scale(1.2, 1);
			//ctx.setTransform(1.2, p.r, 0, 1, p.x, p.y);
			ctx.rotate(p.r);

			ctx.lineWidth = 10 * (fontSize / 50);
			ctx.strokeStyle = "black";
			ctx.fillStyle = "black";
			ctx.fillText(name[i], 0, 0);
			ctx.strokeText(name[i], 0, 0);
			m = ctx.measureText(name[i]).width * 1.25;
			leftPos += m;

			if (["i", "f"].indexOf(name[i]) !== -1) {
				leftPos += m * 0.1;
			}

			ctx.fillStyle = "white";
			ctx.strokeStyle = "white";
			ctx.lineWidth = 2.5 * (fontSize / 50);
			ctx.fillText(name[i], 0, 0);

			ctx.restore();
		}

		targetCtx.drawImage(
			buffer,
			0,
			0,
			580,
			200,

			(395 - (580 / 2)) * s,
			(725 - 200) * s,
			580 * s,
			200 * s
		);

		sunwell.settings.platform.freeBuffer(buffer);
	}

	function draw(cvs, ctx, card, s, cardObj, internalCB) {
		var sw = card.sunwell,
			t,
			drawTimeout,
			drawProgress = 0,
			renderStart = Date.now();

		drawTimeout = setTimeout(function () {
			log("Drawing timeout at point " + drawProgress + " in " + card.name);
			log(card);
			internalCB();
		}, 5000);

		if (typeof card.texture === "string") {
			t = getAsset(card.texture);
		} else {
			if (card.texture instanceof Image) {
				t = card.texture;
			} else {
				t = sunwell.settings.platform.getBuffer();
				t.width = card.texture.crop.w;
				t.height = card.texture.crop.h;
				(function () {
					var tCtx = t.getContext("2d");
					tCtx.drawImage(card.texture.image, card.texture.crop.x, card.texture.crop.y, card.texture.crop.w, card.texture.crop.h, 0, 0, t.width, t.height);
				})();
			}
		}

		if (!t) {
			t = getAsset("~");
		}

		drawProgress = 2;

		ctx.save();
		ctx.clearRect(0, 0, cvs.width, cvs.height);

		// >>>>> Begin Skeleton drawing
		if (renderCache[card._cacheKey]) {
			log("Skipping skeleton draw");
			ctx.drawImage(renderCache[card._cacheKey], 0, 0);
		} else {
			drawProgress = 3;

			ctx.save();
			if (card.type === CardType.MINION) {
				drawEllipse(ctx, 180 * s, 75 * s, 430 * s, 590 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 100 * s, 75 * s, 590 * s, 590 * s);
			}

			if (card.type === CardType.SPELL) {
				ctx.beginPath();
				ctx.rect(125 * s, 165 * s, 529 * s, 434 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 125 * s, 117 * s, 529 * s, 529 * s);
			}

			if (card.type === CardType.WEAPON) {
				drawEllipse(ctx, 150 * s, 135 * s, 476 * s, 468 * s);
				ctx.clip();
				ctx.fillStyle = "grey";
				ctx.fillRect(0, 0, 765 * s, 1100 * s);
				ctx.drawImage(t, 0, 0, t.width, t.height, 150 * s, 135 * s, 476 * s, 476 * s);
			}
			ctx.restore();

			drawProgress = 4;

			ctx.drawImage(getAsset(sw.cardBack), 0, 0, 764, 1100, 0, 0, cvs.width, cvs.height);

			drawProgress = 5;

			if (card.multiClassGroup && card.type === CardType.MINION) {
				ctx.drawImage(getAsset(sw.multiBanner), 0, 0, 184, 369, 17 * s, 88 * s, 184 * s, 369 * s);
			}

			if (card.costHealth) {
				ctx.drawImage(getAsset("health"), 0, 0, 167, 218, 24 * s, 62 * s, 167 * s, 218 * s);
				ctx.save();
				ctx.shadowBlur = 50 * s;
				ctx.shadowColor = "#FF7275";
				ctx.shadowOffsetX = 1000;
				ctx.globalAlpha = .5;
				ctx.drawImage(getAsset("health"), 0, 0, 167, 218, (24 * s) - 1000, 62 * s, 167 * s, 218 * s);
				ctx.restore();
			} else {
				ctx.drawImage(getAsset("gem"), 0, 0, 182, 180, 24 * s, 82 * s, 182 * s, 180 * s);
			}

			drawProgress = 6;

			if (card.type === CardType.MINION) {
				if (sw.rarity) {
					ctx.drawImage(getAsset(sw.rarity), 0, 0, 146, 146, 326 * s, 607 * s, 146 * s, 146 * s);
				}

				ctx.drawImage(getAsset("title"), 0, 0, 608, 144, 94 * s, 546 * s, 608 * s, 144 * s);

				if (card.raceText) {
					ctx.drawImage(getAsset("race"), 0, 0, 529, 106, 125 * s, 937 * s, 529 * s, 106 * s);
				}

				if (!card.hideStats) {
					ctx.drawImage(getAsset("attack"), 0, 0, 214, 238, 0, 862 * s, 214 * s, 238 * s);
					ctx.drawImage(getAsset("health"), 0, 0, 167, 218, 575 * s, 876 * s, 167 * s, 218 * s);
				}

				if (card.elite) {
					ctx.drawImage(getAsset("elite"), 0, 0, 569, 417, 196 * s, 0, 569 * s, 417 * s);
				}
			}

			drawProgress = 7;

			if (card.type === CardType.SPELL) {
				if (sw.rarity) {
					ctx.drawImage(getAsset(sw.rarity), 0, 0, 149, 149, 311 * s, 607 * s, 150 * s, 150 * s);
				}

				ctx.drawImage(getAsset("title-spell"), 0, 0, 646, 199, 66 * s, 530 * s, 646 * s, 199 * s);
			}

			if (card.type === CardType.WEAPON) {
				if (sw.rarity) {
					ctx.drawImage(getAsset(sw.rarity), 0, 0, 146, 144, 315 * s, 592 * s, 146 * s, 144 * s);
				}

				ctx.drawImage(getAsset("title-weapon"), 0, 0, 660, 140, 56 * s, 551 * s, 660 * s, 140 * s);

				if (!card.hideStats) {
					ctx.drawImage(getAsset("swords"), 0, 0, 312, 306, 32 * s, 906 * s, 187 * s, 183 * s);
					ctx.drawImage(getAsset("shield"), 0, 0, 301, 333, 584 * s, 890 * s, 186 * s, 205 * s);
				}
			}

			drawProgress = 8;

			if (card.set !== CardSet.CORE && sw.bgLogo) {
				(function () {
					ctx.globalCompositeOperation = "color-burn";
					if (card.type === CardType.MINION) {
						if (card.raceText) {
							ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 128, 128, 270 * s, 723 * s, 256 * s, 256 * s);
						} else {
							ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 128, 128, 270 * s, 735 * s, 256 * s, 256 * s);
						}
					} else if (card.type === CardType.SPELL) {
						ctx.globalAlpha = 0.7;
						ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 128, 128, 264 * s, 726 * s, 256 * s, 256 * s);
					} else if (card.type === CardType.WEAPON) {
						ctx.globalCompositeOperation = "lighten";
						ctx.globalAlpha = 0.07;
						ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 128, 128, 264 * s, 735 * s, 256 * s, 256 * s);
					}
					ctx.globalCompositeOperation = "source-over";
					ctx.globalAlpha = 1;
				})();
			}

			drawProgress = 9;

			(function () {
				var cacheImage = new Image();
				cacheImage.src = cvs.toDataURL();
				renderCache[card._cacheKey] = cacheImage;
			})();
		}

		// <<<<<<<< Finished Skeleton drawing

		drawProgress = 10;

		if (!card.hideStats) {
			drawNumber(ctx, 116, 170, s, card.cost || 0, 170, card.costStyle);
		}

		drawProgress = 11;

		drawCardName(ctx, s, card);

		drawProgress = 12;

		if (card.type === CardType.MINION) {
			if (card.raceText) {
				renderRaceText(ctx, s, card);
			}

			if (!card.hideStats) {
				drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
				drawNumber(ctx, 668, 994, s, card.health || 0, 150, card.healthStyle);
			}
		}

		drawProgress = 13;

		if (card.type === CardType.WEAPON && !card.hideStats) {
			drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
			drawNumber(ctx, 668, 994, s, card.durability || 0, 150, card.durabilityStyle);
		}

		drawProgress = 14;

		if (!card.silenced || card.type !== CardType.MINION) {
			drawBodyText(ctx, s, card);
		} else {
			ctx.drawImage(getAsset("silence-x"), 0, 0, 410, 397, 200 * s, 660 * s, 410 * s, 397 * s);
		}

		ctx.restore();

		clearTimeout(drawTimeout);

		log("Rendertime: " + (Date.now() - renderStart) + "ms");

		internalCB();

		if (typeof cardObj.target == "function") {
			cardObj.target(cvs);
		} else {
			cardObj.target.src = cvs.toDataURL();
		}
	}

	function queryRender(cardProps) {
		renderQuery.push([cardProps, this]);
		if (!rendering) {
			renderTick();
		}
	}

	function renderTick() {
		if (!ready) {
			return;
		}
		render();
		if (typeof window != "undefined") {
			window.requestAnimationFrame(renderTick);
		} else {
			setTimeout(renderTick, 16);
		}
	}

	function render() {
		if (rendering > maxRendering) {
			return;
		}

		var card, cardObj;

		if (!renderQuery.length) {
			return;
		}

		var renderInfo = renderQuery.shift();
		rendering++;

		card = renderInfo[0];
		cardObj = renderInfo[1];

		var cvs = cardObj._canvas;
		var ctx = cvs.getContext("2d");
		var s = card.width / 764;
		var loadList = ["silence-x", "health"];

		if (card._assetsLoaded === card.width) {
			draw(cvs, ctx, card, s, cardObj, function () {
				rendering--;
				log("Card rendered: " + card.name);
				sunwell.settings.platform.freeBuffer(cvs);
			});
			return;
		}

		log("Preparing assets for: " + card.name);

		card.sunwell = card.sunwell || {};

		if (!card.language) {
			card.language = "enUS";
		}

		function cleanEnum(val, e) {
			if (typeof val === "string") {
				if (val in e) {
					return e[val];
				} else {
					return e["INVALID"];
				}
			}
			return val;
		}
		card.multiClassGroup = cleanEnum(card.multiClassGroup, MultiClassGroup);
		card.playerClass = cleanEnum(card.playerClass, CardClass);
		card.set = cleanEnum(card.set, CardSet);
		card.type = cleanEnum(card.type, CardType)
		card.race = cleanEnum(card.race, Race);

		var sclass = lookup(CardClass, card.playerClass);
		var scardset = lookup(CardSet, card.set);
		var stype = lookup(CardType, card.type);
		var srarity = lookup(Rarity, card.rarity);
		var smulti = lookup(MultiClassGroup, card.multiClassGroup);

		if (card.type == CardType.MINION && card.race && !card.raceText) {
			card.raceText = getRaceText(card.race, card.language);
		}

		card.sunwell.cardBack = "frame-" + stype.toLowerCase() + "-" + sclass.toLowerCase();
		loadList.push(card.sunwell.cardBack);
		loadList.push("gem");

		if (card.type === CardType.MINION) {
			loadList.push("attack", "title");

			if (card.elite) {
				loadList.push("elite");
			}

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "rarity-" + srarity.toLowerCase();
				loadList.push(card.sunwell.rarity);
			}
		}

		if (card.type === CardType.SPELL) {
			loadList.push("attack", "title-spell");

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "spell-rarity-" + srarity.toLowerCase();
				loadList.push(card.sunwell.rarity);
			}
		}

		if (card.type === CardType.WEAPON) {
			loadList.push("swords", "shield", "title-weapon");

			if (card.rarity !== Rarity.FREE && !(card.rarity === Rarity.COMMON && card.set === CardSet.CORE)) {
				card.sunwell.rarity = "weapon-rarity-" + srarity.toLowerCase();
				loadList.push(card.sunwell.rarity);
			}
		}

		var watermark = getWatermarkAsset(card.set);
		if (watermark) {
			card.sunwell.bgLogo = watermark;
			loadList.push(watermark);
		}

		if (card.raceText) {
			loadList.push("race");
		}

		if (card.multiClassGroup) {
			card.sunwell.multiBanner = "multi-" + smulti.toLowerCase();
			loadList.push(card.sunwell.multiBanner);
		}

		if (typeof card.texture === "string" && card.set !== CardSet.CHEAT) {
			if (s <= .5) {
				loadList.push("h:" + card.texture);
			} else {
				loadList.push("t:" + card.texture);
			}
		}

		log("Assets prepared, now loading");

		fetchAssets(loadList).then(function () {
			log("Assets loaded for: " + card.name);
			card._assetsLoaded = card.width;
			draw(cvs, ctx, card, s, cardObj, function () {
				rendering--;
				log("Card rendered: " + card.name);
				sunwell.settings.platform.freeBuffer(cvs);
			});
		});
	};

	/**
	 * This will flush sunwell"s render caches.
	 */
	sunwell.clearCache = function () {
		renderCache = {};
	};

	sunwell.Card = function (props, width, renderTarget) {
		var validRarity = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];

		if (!props) {
			throw new Error("No card properties given");
		}

		if (!renderTarget) {
			renderTarget = new Image();
		}
		this.target = renderTarget;

		var height = Math.round(width * 1.4397905759);
		this._canvas = sunwell.settings.platform.getBuffer(width, height, true);

		//Make compatible to tech cards
		if (validRarity.indexOf(props.rarity) === -1) {
			props.rarity = Rarity.FREE;
		}

		if (props.gameId === undefined) {
			props.gameId = props.id;
		}

		props.costStyle = props.costStyle || "0";
		props.healthStyle = props.healthStyle || "0";
		props.attackStyle = props.attackStyle || "0";
		props.durabilityStyle = props.durabilityStyle || "0";

		props.silenced = props.silenced || false;
		props.costHealth = props.costHealth || false;

		props.width = width;

		props._cacheKey = checksum(props);

		this._props = props;

		log("Queried render: " + props.name);

		this._render = queryRender.bind(this);

		this._render(this._props);
	};

	sunwell.Card.prototype = {
		target: null,
		_render: null,
		_props: null,
		redraw: function () {
			delete renderCache[this._props._cacheKey];
			this._render(this._props);
		},
		update: function (props) {
			for (var key in props) {
				this._props[key] = props[key];
			}

			this._props._cacheKey = checksum(this._props);

			this._render(this._props);
		}
	};

	/**
	 * Creates a new card object that can also be manipulated at a later point.
	 * Provide an image object as render target as output for the visual card data.
	 * @param settings
	 * @param width
	 * @param renderTarget
	 */
	sunwell.createCard = function (settings, width, renderTarget) {
		return new sunwell.Card(settings, width, renderTarget);
	}
})();
