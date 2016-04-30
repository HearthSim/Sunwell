/**
 * Sunwell
 * =======
 * Sunwell is a renderer for hearthstone cards.
 *
 * @author Christian Engel <hello@wearekiss.com>
 */

(function () {
    'use strict';

    var sunwell,
        assets = {},
        ready = false,
        renderQuery = [],
        maxRendering = 12,
        rendering = 0,
        renderCache = {},
        buffers = [],
        pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g,
        validRarity = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

    function log(msg) {
        if (!sunwell.settings.debug) {
            return;
        }
        console.log(msg);
    }

    /**
     * Returns a new render buffer (canvas).
     * @returns {*}
     */
    function getBuffer() {
        if (buffers.length) {
            return buffers.pop();
        }
        return document.createElement('canvas');
    }

    /**
     * Makes a new render buffer available for recycling.
     * @param buffer
     */
    function freeBuffer(buffer) {
        buffers.push(buffer);
    }

    var imgReplacement;

    function getMissingImg(assetId) {
        log('Substitute for ' + assetId);

        if (imgReplacement) {
            return imgReplacement;
        }

        var buffer = getBuffer(),
            bufferctx = buffer.getContext('2d');
        buffer.width = buffer.height = 512;
        bufferctx.save();
        bufferctx.fillStyle = 'grey';
        bufferctx.fillRect(0, 0, 512, 512);
        bufferctx.fill();
        bufferctx.fillStyle = 'red';
        bufferctx.textAlign = 'center';
        bufferctx.textBaseline = 'middle';
        bufferctx.font = '50px Belwe';
        bufferctx.fillText('missing artwork', 256, 256);
        bufferctx.restore();
        imgReplacement = new Image();
        imgReplacement.src = buffer.toDataURL();
        return imgReplacement;
    }

    function getAsset(id) {
        return assets[id] || getMissingImg(id);
    }

    window.sunwell = sunwell = window.sunwell || {};

    sunwell._buffers = buffers;
    sunwell._renderQuery = renderQuery;
    sunwell._activeRenders = rendering;

    sunwell.settings = sunwell.settings || {};

    sunwell.settings.titleFont = sunwell.settings.titleFont || 'Belwe Bold';
    sunwell.settings.bodyFont = sunwell.settings.bodyFont || 'ITC Franklin Condensed';
    sunwell.settings.bodyFontSize = sunwell.settings.bodyFontSize || 60;
    sunwell.settings.bodyFontOffset = sunwell.settings.bodyFontOffset || {x: 0, y: 0};
    sunwell.settings.bodyLineHeight = sunwell.settings.bodyLineHeight || 50;
    sunwell.settings.assetFolder = sunwell.settings.assetFolder || '/assets/';
    sunwell.settings.textureFolder = sunwell.settings.textureFolder || '/artwork/';
    sunwell.settings.smallTextureFolder = sunwell.settings.smallTextureFolder || null;
    sunwell.settings.autoInit = sunwell.settings.autoInit || true;
    sunwell.settings.idAsTexture = sunwell.settings.idAsTexture || false;


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

    sunwell.races = {
        'enUS': {
            'MURLOC': 'Murloc',
            'MECHANICAL': 'Mech',
            'BEAST': 'Beast',
            'DEMON': 'Demon',
            'PIRATE': 'Pirate',
            'DRAGON': 'Dragon',
            'TOTEM': 'Totem'
        },
        "deDE": {
            'MURLOC': 'Murloc',
            'MECHANICAL': 'Mech',
            'BEAST': 'Wildtier',
            'DEMON': 'Dämon',
            'PIRATE': 'Pirat',
            'DRAGON': 'Drache',
            'TOTEM': 'Totem'
        }
    };

    /**
     * Calculate the checksum for an object.
     * @param o
     * @returns {number}
     */
    function checksum(o) {
        var i, key, s = '';
        var chk = 0x12345678;

        for (key in o) {
            s = s + key + o[key];
        }

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
            xe = x + w,           // x-end
            ye = y + h,           // y-end
            xm = x + w / 2,       // x-middle
            ym = y + h / 2;       // y-middle

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
     * You can call this before you start to render any cards, but you don't have to.
     */
    function fetchAssets(loadAssets) {
        return new Promise(function (resolve) {
            var loaded = 0,
                loadingTotal = 1,
                result = {},
                key,
                isTexture,
                smallTexture,
                isUrl,
                srcURL;

            for (var i = 0; i < loadAssets.length; i++) {
                key = loadAssets[i];
                isTexture = false;
                smallTexture = false;

                if (key.substr(0, 2) === 'h:') {
                    isTexture = true;
                    smallTexture = !!(sunwell.settings.smallTextureFolder && true);
                    key = key.substr(2);
                }

                if (key.substr(0, 2) === 't:') {
                    isTexture = true;
                    key = key.substr(2);
                    if (assets[key] !== undefined) {
                        if (assets[key].width === 256) {
                            assets[key] = undefined;
                        }
                    }
                }

                if (key.substr(0, 2) === 'u:') {
                    isUrl = true;
                    key = key.substr(2);
                }

                if (assets[key] === undefined) {
                    assets[key] = new Image();
                    assets[key].crossOrigin = "Anonymous";
                    assets[key].loaded = false;
                    loadingTotal++;
                    (function (key) {
                        assets[key].addEventListener('load', function () {
                            loaded++;
                            assets[key].loaded = true;
                            result[key] = assets[key];
                            if (!assets[key].width || !assets[key].height) {
                                assets[key].src = getMissingImg().src;
                            }
                            if (loaded >= loadingTotal) {
                                resolve(result);
                            }
                        });
                        assets[key].addEventListener('error', function () {
                            loaded++;

                            assets[key].src = getMissingImg().src;
                            assets[key].loaded = true;
                            result[key] = assets[key];
                            if (loaded >= loadingTotal) {
                                resolve(result);
                            }
                        });
                    })(key);
                    if (isUrl) {
                        assets[key].src = key;
                    } else {
                        if (isTexture) {
                            assets[key].isTexture = true;
                            if (smallTexture) {
                                srcURL = sunwell.settings.smallTextureFolder + key + '.jpg';
                            } else {
                                srcURL = sunwell.settings.textureFolder + key + '.jpg';
                            }
                        } else {
                            srcURL = sunwell.settings.assetFolder + key + '.png';
                            ;
                        }
                        log('Requesting ' + srcURL);
                        assets[key].src = srcURL;
                    }
                } else {
                    loadingTotal++;
                    if (assets[key].loaded) {
                        loaded++;
                        result[key] = assets[key];
                    } else {
                        (function (key) {
                            assets[key].addEventListener('load', function () {
                                loaded++;
                                result[key] = assets[key];
                                if (loaded >= loadingTotal) {
                                    resolve(result);
                                }
                            });
                        })(key);
                    }
                }
            }

            loadingTotal--;
            if (loaded > 0 && loaded >= loadingTotal) {
                resolve(result);
            }
        });
    }

    /**
     * Get the bounding box of a canvas' content.
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

    function renderRaceText(targetCtx, s, card) {
        var text, x;

        if (sunwell.races[card.language]) {
            if (sunwell.races[card.language][card.race]) {
                text = sunwell.races[card.language][card.race];
            } else {
                text = card.race;
            }
        } else {
            if (sunwell.races['enUS'][card.race]) {
                text = sunwell.races['enUS'][card.race];
            } else {
                text = card.race;
            }
        }

        var buffer = getBuffer();
        var bufferCtx = buffer.getContext('2d');

        buffer.width = 300;
        buffer.height = 60;

        bufferCtx.font = '45px Belwe';

        bufferCtx.lineCap = 'round';
        bufferCtx.lineJoin = 'round';
        bufferCtx.textBaseline = 'hanging';

        bufferCtx.textAlign = 'left';

        text = text.split('');

        x = 10;

        for (var i = 0; i < text.length; i++) {
            bufferCtx.lineWidth = 8;
            bufferCtx.strokeStyle = 'black';
            bufferCtx.fillStyle = 'black';
            bufferCtx.fillText(text[i], x, 10);
            bufferCtx.strokeText(text[i], x, 10);

            bufferCtx.fillStyle = 'white';
            bufferCtx.strokeStyle = 'white';
            bufferCtx.lineWidth = 1;
            bufferCtx.fillText(text[i], x, 10);
            //ctx.strokeText(text[i], x, y);

            x += bufferCtx.measureText(text[i]).width;
        }

        var b = contextBoundingBox(bufferCtx);

        targetCtx.drawImage(buffer, b.x, b.y, b.w, b.h, (394 - (b.w / 2)) * s, (1001 - (b.h / 2)) * s, b.w * s, b.h * s);

        freeBuffer(buffer);
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
        var buffer = getBuffer();
        var bufferCtx = buffer.getContext('2d');

        if (drawStyle === undefined) {
            drawStyle = '0';
        }

        buffer.width = 256;
        buffer.height = 256;

        number = number.toString();

        number = number.split('');

        var tX = 10;

        bufferCtx.font = size + 'px Belwe';

        bufferCtx.lineCap = 'round';
        bufferCtx.lineJoin = 'round';
        bufferCtx.textBaseline = 'hanging';

        bufferCtx.textAlign = 'left';

        var color = 'white';

        if (drawStyle === '-') {
            color = '#f00';
        }

        if (drawStyle === '+') {
            color = '#0f0';
        }

        for (var i = 0; i < number.length; i++) {
            bufferCtx.lineWidth = 13;
            bufferCtx.strokeStyle = 'black';
            bufferCtx.fillStyle = 'black';
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

        freeBuffer(buffer);
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
            bufferTextCtx.strokeStyle = 'red';
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
        var manualBreak = card.text.substr(0, 3) === '[x]',
            bufferText = getBuffer(),
            bufferTextCtx = bufferText.getContext('2d'),
            bufferRow = getBuffer(),
            bufferRowCtx = bufferRow.getContext('2d'),
            bodyText = manualBreak ? card.text.substr(3) : card.text,
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
            pBodyText;


        pBodyText = bodyText;
        while((plurals = pluralRegex.exec(bodyText)) !== null){
            pBodyText = pBodyText.replace(plurals[0], plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4]));
        }
        bodyText = pBodyText;

        words = bodyText.replace(/[\$#_]/g, '').split(/( |\n)/g);

        log('Rendering body: ' + bodyText);

        centerLeft = 390;
        centerTop = 860;
        bufferText.width = 520;
        bufferText.height = 290;

        bufferRow.width = 520;

        if (card.type === 'SPELL') {
            bufferText.width = 460;
            bufferText.height = 290;

            bufferRow.width = 460;
        }

        if (card.type === 'WEAPON') {
            bufferText.width = 470;
            bufferText.height = 250;

            bufferRow.width = 470;
        }

        var fontSize = sunwell.settings.bodyFontSize;
        var lineHeight = sunwell.settings.bodyLineHeight;
        var totalLength = card.text.replace(/<\/*.>/g, '').length;
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


        if (totalLength >= 75 && card.type === 'SPELL') {
            smallerFirstLine = true;
        }

        if(forceSmallerFirstLine){
            smallerFirstLine = true;
        }

        if (card.type === 'WEAPON') {
            bufferRowCtx.fillStyle = '#fff';
        } else {
            bufferRowCtx.fillStyle = '#000';
        }
        bufferRowCtx.textBaseline = 'hanging';

        bufferRowCtx.font = fontSize + 'px/1em "' + sunwell.settings.bodyFont + '", sans-serif';

        spaceWidth = 3;

        for (i = 0; i < words.length; i++) {
            word = words[i];

            chars = word.split('');

            width = bufferRowCtx.measureText(word).width;
            log('Next word: ' + word);

            if (!manualBreak && (xPos + width > bufferRow.width || (smallerFirstLine && xPos + width > bufferRow.width * 0.8))) {
                log((xPos + width) + ' > ' + bufferRow.width);
                log('Calculated line break');
                smallerFirstLine = false;
                lineCount++;
                r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
                xPos = r[0];
                yPos = r[1];
                justLineBreak = true;
            }

            for (j = 0; j < chars.length; j++) {
                char = chars[j];

                log(char + ' ' + char.charCodeAt(0));

                if (char.charCodeAt(0) === 10) {
                    if (justLineBreak) {
                        justLineBreak = false;
                        continue;
                    }
                    lineCount++;
                    r = finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);
                    xPos = r[0];
                    yPos = r[1];
                    log('Manual line break');
                    continue;
                }

                justLineBreak = false;

                if (char === '<') {
                    if (chars[j + 1] === '/') {
                        if (chars[j + 2] === 'b') {
                            isBold--;
                            j += 3;
                        }

                        if (chars[j + 2] === 'i') {
                            isItalic--;
                            j += 3;
                        }
                    } else {
                        if (chars[j + 1] === 'b') {
                            isBold++;
                            j += 2;
                        }

                        if (chars[j + 1] === 'i') {
                            isItalic++;
                            j += 2;
                        }
                    }

                    bufferRowCtx.font = (isBold > 0 ? 'bold ' : '') + (isItalic > 0 ? 'italic' : '') + ' ' + fontSize + 'px/1em "' + sunwell.settings.bodyFont + '", sans-serif';
                    continue;
                }

                bufferRowCtx.fillText(char, xPos + sunwell.settings.bodyFontOffset.x, sunwell.settings.bodyFontOffset.y);

                xPos += bufferRowCtx.measureText(char).width + (spaceWidth / 8);
            }

            xPos += spaceWidth;
        }

        lineCount++;
        finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);

        freeBuffer(bufferRow);

        if(card.type === 'SPELL' && lineCount === 4){
            if(!smallerFirstLine && !forceSmallerFirstLine){
                drawBodyText(targetCtx, s, card, true);
                return;
            }
        }

        var b = contextBoundingBox(bufferTextCtx);

        b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

        targetCtx.drawImage(bufferText, b.x, b.y - 2, b.w, b.h, (centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);

        freeBuffer(bufferText);

        if (sunwell.settings.debug) {
            targetCtx.save();
            targetCtx.strokeStyle = 'green';
            targetCtx.beginPath();
            targetCtx.rect((centerLeft - (b.w / 2)) * s, (centerTop - (b.h / 2)) * s, b.w * s, (b.h + 2) * s);
            targetCtx.stroke();
            targetCtx.strokeStyle = 'red';
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
     * Prints the title of a card.
     * @param title
     */
    function drawCardTitle(targetCtx, s, card) {
        var buffer = getBuffer();
        var title = card.title;
        buffer.width = 1024;
        buffer.height = 200;
        var ctx = buffer.getContext('2d');
        var boundaries;
        ctx.save();

        var pathMiddle = .58;
        var maxWidth = 580;

        //Path midpoint at t = 0.56
        var c = [
            {x: 0, y: 110},
            {x: 102, y: 137},
            {x: 368, y: 16},
            {x: 580, y: 100}
        ];

        if (card.type === 'SPELL') {
            pathMiddle = .52;
            maxWidth = 580;
            c = [
                {x: 10, y: 100},
                {x: 212, y: 35},
                {x: 368, y: 35},
                {x: 570, y: 105}
            ]
        }

        if (card.type === 'WEAPON') {
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
        ctx.strokeStyle = 'black';

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        var textWidth = maxWidth + 1;
        var steps,
            begin;

        while (textWidth > maxWidth && fontSize > 10) {
            fontSize -= 1;
            ctx.font = fontSize + 'px Belwe';
            textWidth = 0;
            for (var i = 0; i < title.length; i++) {
                textWidth += ctx.measureText(title[i]).width + 2;
            }

            textWidth *= 1.25;
        }

        textWidth = textWidth / maxWidth;
        begin = pathMiddle - (textWidth / 2);
        steps = textWidth / title.length;

        if (sunwell.settings.debug) {
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(c[0].x, c[0].y);
            ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);
            ctx.stroke();
            ctx.restore();
        }

        var p, t, leftPos = 0, m;
        for (i = 0; i < title.length; i++) {
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
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'black';
            ctx.fillText(title[i], 0, 0);
            ctx.strokeText(title[i], 0, 0);
            m = ctx.measureText(title[i]).width * 1.25;
            leftPos += m;

            if (['i', 'f'].indexOf(title[i]) !== -1) {
                leftPos += m * 0.1;
            }

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2.5 * (fontSize / 50);
            ctx.fillText(title[i], 0, 0);

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

        freeBuffer(buffer);
    }

    function draw(cvs, ctx, card, s, callback, internalCB) {

        var sw = card.sunwell,
            t,
            drawTimeout,
            drawProgress = 0,
            renderStart = Date.now();

        drawTimeout = setTimeout(function () {
            log('Drawing timeout at point ' + drawProgress + ' in ' + card.title);
            log(card);
            internalCB();
            if (callback) {
                callback(cvs);
            }
        }, 5000);

        if (typeof card.texture === 'string') {
            t = getAsset(card.texture);
        } else {
            if (card.texture instanceof Image) {
                t = card.texture;
            } else {
                t = getBuffer();
                t.width = card.texture.crop.w;
                t.height = card.texture.crop.h;
                (function () {
                    var tCtx = t.getContext('2d');
                    tCtx.drawImage(card.texture.image, card.texture.crop.x, card.texture.crop.y, card.texture.crop.w, card.texture.crop.h, 0, 0, t.width, t.height);
                })();
            }
        }

        if (!t) {
            t = getAsset('~');
        }

        drawProgress = 2;

        ctx.save();
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        drawProgress = 3;

        ctx.save();
        if (card.type === 'MINION') {
            drawEllipse(ctx, 180 * s, 75 * s, 430 * s, 590 * s);
            ctx.clip();
            ctx.fillStyle = 'grey';
            ctx.fillRect(0, 0, 765 * s, 1100 * s);
            ctx.drawImage(t, 0, 0, t.width, t.height, 100 * s, 75 * s, 590 * s, 590 * s);
        }

        if (card.type === 'SPELL') {
            ctx.rect(125 * s, 165 * s, 529 * s, 434 * s);
            ctx.clip();
            ctx.fillStyle = 'grey';
            ctx.fillRect(0, 0, 765 * s, 1100 * s);
            ctx.drawImage(t, 0, 0, t.width, t.height, 125 * s, 117 * s, 529 * s, 529 * s);
        }

        if (card.type === 'WEAPON') {
            drawEllipse(ctx, 150 * s, 135 * s, 476 * s, 468 * s);
            ctx.clip();
            ctx.fillStyle = 'grey';
            ctx.fillRect(0, 0, 765 * s, 1100 * s);
            ctx.drawImage(t, 0, 0, t.width, t.height, 150 * s, 135 * s, 476 * s, 476 * s);
        }
        ctx.restore();

        drawProgress = 4;

        ctx.drawImage(getAsset(sw.cardBack), 0, 0, 764, 1100, 0, 0, cvs.width, cvs.height);

        drawProgress = 5;

        if(card.costHealth){
            ctx.drawImage(getAsset('health'), 0, 0, 167, 218, 24 * s, 62 * s, 167 * s, 218 * s);
            ctx.save();
            ctx.shadowBlur=50*s;
            ctx.shadowColor='#FF7275';
            ctx.shadowOffsetX = 1000;
            ctx.globalAlpha = .5;
            ctx.drawImage(getAsset('health'), 0, 0, 167, 218, (24 * s)-1000, 62 * s, 167 * s, 218 * s);
            ctx.restore();
        } else {
            ctx.drawImage(getAsset('gem'), 0, 0, 182, 180, 24 * s, 82 * s, 182 * s, 180 * s);
        }

        drawProgress = 6;

        if (card.type === 'MINION') {
            if (sw.rarity) {
                ctx.drawImage(getAsset(sw.rarity), 0, 0, 146, 146, 326 * s, 607 * s, 146 * s, 146 * s);
            }

            ctx.drawImage(getAsset('title'), 0, 0, 608, 144, 94 * s, 546 * s, 608 * s, 144 * s);

            if (card.race) {
                ctx.drawImage(getAsset('race'), 0, 0, 529, 106, 125 * s, 937 * s, 529 * s, 106 * s);
            }

            ctx.drawImage(getAsset('attack'), 0, 0, 214, 238, 0, 862 * s, 214 * s, 238 * s);
            ctx.drawImage(getAsset('health'), 0, 0, 167, 218, 575 * s, 876 * s, 167 * s, 218 * s);

            if (card.rarity === 'LEGENDARY') {
                ctx.drawImage(getAsset('dragon'), 0, 0, 569, 417, 196 * s, 0, 569 * s, 417 * s);
            }
        }

        drawProgress = 7;

        if (card.type === 'SPELL') {
            if (sw.rarity) {
                ctx.drawImage(getAsset(sw.rarity), 0, 0, 149, 149, 311 * s, 607 * s, 150 * s, 150 * s);
            }

            ctx.drawImage(getAsset('title-spell'), 0, 0, 646, 199, 66 * s, 530 * s, 646 * s, 199 * s);
        }

        if (card.type === 'WEAPON') {
            if (sw.rarity) {
                ctx.drawImage(getAsset(sw.rarity), 0, 0, 146, 144, 315 * s, 592 * s, 146 * s, 144 * s);
            }

            ctx.drawImage(getAsset('title-weapon'), 0, 0, 660, 140, 56 * s, 551 * s, 660 * s, 140 * s);

            ctx.drawImage(getAsset('swords'), 0, 0, 312, 306, 32 * s, 906 * s, 187 * s, 183 * s);
            ctx.drawImage(getAsset('shield'), 0, 0, 301, 333, 584 * s, 890 * s, 186 * s, 205 * s);
        }

        drawProgress = 8;


        if (card.set !== 'CORE') {
            (function () {
                var xPos;

                if (card.type === 'SPELL') {
                    xPos = 265;
                }

                if (card.type === 'MINION') {
                    xPos = 265;
                }

                if (card.race && card.type === 'MINION') {
                    ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 281, 244, xPos * s, 734 * s, (281 * 0.95) * s, (244 * 0.95) * s);
                } else {
                    if (card.type === 'SPELL') {
                        ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 281, 244, xPos * s, 740 * s, 253 * s, 220 * s);
                    } else {
                        ctx.drawImage(getAsset(sw.bgLogo), 0, 0, 281, 244, xPos * s, 734 * s, 281 * s, 244 * s);
                    }

                }
            })();
        }

        drawProgress = 9;


        drawProgress = 10;

        drawNumber(ctx, 116, 170, s, card.cost || 0, 170, card.costStyle);

        drawProgress = 11;

        drawCardTitle(ctx, s, card);

        drawProgress = 12;

        if (card.type === 'MINION') {
            if (card.race) {
                renderRaceText(ctx, s, card);
            }

            drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
            drawNumber(ctx, 668, 994, s, card.health || 0, 150, card.healthStyle);
        }

        drawProgress = 13;

        if (card.type === 'WEAPON') {
            drawNumber(ctx, 128, 994, s, card.attack || 0, 150, card.attackStyle);
            drawNumber(ctx, 668, 994, s, card.durability || 0, 150, card.durabilityStyle);
        }

        drawProgress = 14;

        if (!card.silenced || card.type !== 'MINION') {
            drawBodyText(ctx, s, card);
        } else {
            ctx.drawImage(getAsset('silence-x'), 0, 0, 410, 397, 200 * s, 660 * s, 410 * s, 397 * s);
        }

        ctx.restore();

        clearTimeout(drawTimeout);

        log('Rendertime: ' + (Date.now() - renderStart) + 'ms');

        internalCB();
        if (callback) {
            callback(cvs);
        }
    }

    function queryRender(card, resolution, callback) {
        renderQuery.push([card, resolution, callback]);
        if (!rendering) {
            renderTick();
        }
    }

    function renderTick() {
        if (!ready) {
            return;
        }
        render();
        window.requestAnimationFrame(renderTick);
    }

    /**
     * Renders the HS-API object, you pass to this function.
     * @param conf
     * @param [resolution=512] The desired width of the rendered card.
     * @return Canvas
     */
    function render() {
        if (rendering > maxRendering) {
            return;
        }

        var card, resolution, callback;

        if (!renderQuery.length) {
            return;
        }

        var renderInfo = renderQuery.shift();

        rendering++;

        card = renderInfo[0];
        resolution = renderInfo[1];
        callback = renderInfo[2];

        log('Preparing assets for: ' + card.title);

        var cvs = getBuffer(),
            ctx = cvs.getContext('2d'),
            s = (resolution || 512) / 764,
            loadList = ['silence-x'];

        cvs.width = resolution || 512;
        cvs.height = Math.round(cvs.width * 1.4397905759);

        card.sunwell = card.sunwell || {};

        card.sunwell.cardBack = card.type.substr(0, 1).toLowerCase() + card.playerClass.substr(0, 1) + card.playerClass.substr(1).toLowerCase();

        loadList.push(card.sunwell.cardBack);

        loadList.push('gem');

        if (card.type === 'MINION') {
            loadList.push('attack', 'health', 'title');

            if (card.rarity === 'LEGENDARY') {
                loadList.push('dragon');
            }

            if (card.rarity !== 'FREE' && !(card.rarity === 'COMMON' && card.set === 'CORE')) {
                card.sunwell.rarity = 'rarity-' + card.rarity.toLowerCase();
                loadList.push(card.sunwell.rarity);
            }
        }

        if (card.type === 'SPELL') {
            loadList.push('attack', 'health', 'title-spell');

            if (card.rarity !== 'FREE' && !(card.rarity === 'COMMON' && card.set === 'CORE')) {
                card.sunwell.rarity = 'spell-rarity-' + card.rarity.toLowerCase();
                loadList.push(card.sunwell.rarity);
            }
        }

        if (card.type === 'WEAPON') {
            loadList.push('swords', 'shield', 'title-weapon');

            if (card.rarity !== 'FREE' && !(card.rarity === 'COMMON' && card.set === 'CORE')) {
                card.sunwell.rarity = 'weapon-rarity-' + card.rarity.toLowerCase();
                loadList.push(card.sunwell.rarity);
            }
        }


        if (['BRM', 'GVG', 'LOE', 'NAX', 'TGT', 'OG'].indexOf(card.set) === -1) {
            card.sunwell.bgLogo = 'bg-cl';
        } else {
            card.sunwell.bgLogo = 'bg-' + card.set.toLowerCase();
        }

        if (card.type === 'SPELL') {
            card.sunwell.bgLogo = 'spell-' + card.sunwell.bgLogo;
        }

        loadList.push(card.sunwell.bgLogo);

        if (card.race) {
            loadList.push('race');
        }


        if (typeof card.texture === 'string' && card.set !== 'CHEAT') {
            if (s <= .5) {
                loadList.push('h:' + card.texture);
            } else {
                loadList.push('t:' + card.texture);
            }
        }

        log('Assets prepared, now loading');

        fetchAssets(loadList)
            .then(function () {
                log('Assets loaded for: ' + card.title);
                draw(cvs, ctx, card, s, callback, function () {
                    rendering--;
                    log('Card rendered: ' + card.title);
                    freeBuffer(cvs);
                });
            });
    };

    /**
     * This will flush sunwell's render caches.
     */
    sunwell.clearCache = function () {
        renderCache = {};
    };

    /**
     * Creates a new card object that can also be manipulated at a later point.
     * Provide an image object as render target as output for the visual card data.
     * @param settings
     * @param width
     * @param renderTarget
     */
    sunwell.createCard = function (settings, width, renderTarget) {
        if (!settings) {
            throw new Error('No card object given');
        }

        if (!renderTarget) {
            renderTarget = new Image();
        }

        //Make compatible to tech cards
        if (validRarity.indexOf(settings.rarity) === -1) {
            settings.rarity = 'FREE';
        }

        //Make compatible to hearthstoneJSON format.
        if (settings.title === undefined) {
            settings.title = settings.name;
        }
        if (settings.gameId === undefined) {
            settings.gameId = settings.id;
        }

        if (sunwell.settings.idAsTexture) {
            settings.texture = settings.gameId;
        }

        settings.costStyle = settings.costStyle || '0';
        settings.healthStyle = settings.healthStyle || '0';
        settings.attackStyle = settings.attackStyle || '0';
        settings.durabilityStyle = settings.durabilityStyle || '0';

        settings.silenced = settings.silenced || false;
        settings.costHealth = settings.costHealth || false;

        settings.width = width;

        var cacheKey = checksum(settings);

        if (renderCache[cacheKey] && !sunwell.settings.debug) {
            renderTarget.src = renderCache[cacheKey];
            return;
        }

        log('Queried render: ' + settings.title);

        queryRender(settings, width, function (result) {
            renderTarget.src = renderCache[cacheKey] = result.toDataURL();
        });

        return {
            target: renderTarget,
            redraw: function () {
                cacheKey = checksum(settings);
                delete renderCache[cacheKey];
                queryRender(settings, width, function (result) {
                    renderTarget.src = renderCache[cacheKey] = result.toDataURL();
                });
            },
            update: function (properties) {
                for (var key in properties) {
                    settings[key] = properties[key];
                }

                cacheKey = checksum(settings);

                if (renderCache[cacheKey]) {
                    renderTarget.src = renderCache[cacheKey];
                    return;
                }

                queryRender(settings, width, function (result) {
                    renderTarget.src = renderCache[cacheKey] = result.toDataURL();
                });
            }
        };
    }
})();