# Sunwell

A HTML5 canvas based renderer for hearthstone cards.

* Works in your browser through javascript and the &lt;canvas&gt; element.
* Works from the command line with node and [node-canvas](https://github.com/Automattic/node-canvas).


## Download

The latest, minified version of Sunwell is available here:

https://sunwell.hearthsim.net/branches/master/sunwell.js


## Requirements

Obviously, you need a couple of graphical assets to make this renderer work.

I prepared a couple of skeleton assets for the cards via Photoshop, but the main card artworks are not
included in this repository. In order to render cards, you need to obtain the card artworks and place
them in the `/artwork` folder.

You also need to obtain a copy of the Belwe and ITC Franklin Gothic font, as its being used to render the cards title, body
and number values. You can place the web font files in the `/font` directory. A substitute for the card body text
font will be loaded from google fonts.

## Running in node

You will need a few node dependencies and node-canvas compiled from the source for `Canvas.registerFont` to be available:

```sh
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
npm install -g node-gyp
npm install github:automattic/node-canvas
npm install mkdirp
npm install promise
npm install request
```

## Usage
Load the web fonts, used on your rendered cards through CSS, or even better: [google font loader](https://github.com/typekit/webfontloader).

Set up sunwell with your own settings before loading the library itself:

```javascript
<script>
	window.sunwell = {
		settings: {
			titleFont: 'Belwe',
			bodyFont: 'ITC Franklin Condensed',
			bodyFontSize: 24,
			bodyLineHeight: 55,
			bodyBaseline: 'middle',
			bodyFontOffset: {x: 0, y: 0},
			assetFolder: '/assets/',
			textureFolder: '/artworks/',
			smallTextureFolder: '/smallArtworks/',
			autoInit: false,
			debug: false
		}
	};
</script>
<script src="sunwell.js">
```

If you set `autoInit` to `false` - which I recommend; sunwell will wait with the rendering of any cards until you call
`sunwell.init()`. Call this methods when your web fonts have been loaded.

After being loaded, sunwell will provide the methods to the global object `sunwell` for you to interact with and
generate cards from.


### Rendering a card
To render a specific card, you can call the method `createCard()` of the global `sunwell` object.

```js
var cardObj = sunwell.createCard(cardData, width, [renderTarget]);
```

The `cardData` parameter is an object containing information about the card to be rendered. `width`
defines the width of the card to be rendered. Sunwell provides a "native" resolution up to 764x1100
pixels. While you can set a higher value than 764 for the desired render, it will only result in blurry
results. The max supported resolution of sunwell is already by far greater than in the game itself.

The `renderTarget` parameter is the only one thats optional. Pass a previously created Image object
here, to have the rendered result in there. If you don't provide such an object, sunwell will create one.

The object you pass as `cardData` can be obtained for example through [HearthstoneJSON](https://hearthstonejson.com/).

```json
{
	"id": "CS2_087",
	"artist": "Zoltan Boros",
	"set": "CORE",
	"type": "SPELL",
	"rarity": "FREE",
	"cost": 1,
	"name": "Blessing of Might",
	"flavor": "\"As in, you MIGHT want to get out of my way.\" - Toad Mackle, recently buffed.",
	"playRequirements": {"REQ_TARGET_TO_PLAY": 0,"REQ_MINION_TARGET": 0},
	"collectible": true,
	"playerClass": "PALADIN",
	"howToEarnGolden": "Unlocked at Level 45.",
	"howToEarn": "Unlocked at Level 1.",
	"text": "Give a minion +3 Attack.",
	"texture": "W16_a053_D"
}
```

Some properties are purely optional, since they are not used by sunwell, but these ones are required:

```json
{
	"id": "CS2_087",
	"set": "CORE",
	"type": "SPELL",
	"rarity": "FREE",
	"cost": 1,
	"name": "Blessing of Might",
	"playerClass": "PALADIN",
	"text": "Give a minion +3 Attack.",
	"texture": "W16_a053_D"
}
```

In case of a minion or weapon card, you also need to pass `health` (or `durability`, but health is fine for weapons, too) and/or `attack`.

The method will return an object that provides an interface to manipulate the card after its creation.

You can also access the image object that contains the cards image data through `cardObj.target`.

If you want to update certain properties on the original `cardData`, simply call `cardObj.update()` and
pass an object with the properties you want to overwrite.

### Changing the number colors

If you want to make the numbers appear green/red, you can also pass in the following properties on your card object to both
`createCard()` and/or `cardObj.update()`:

```javascript
{
	"costStyle": "0",
	"attackStyle": "+",
	"healthStyle": "-",
	"durabilityStyle": "-"
}
```

All the style default to "0". Setting the style to "+" makes the number appear green, setting it to "-" makes it appear red.


### Silence a minion
To silence a minion, set `silenced: true` either when creating the card, or with the update function.

### Let a card cost health instead of mana
Introduced by [Cho'gall](http://hearthstonelabs.com/cards#lang=enUS;detail=OG_121), cards may cost health instead of mana.
You can switch any cards cost icon by setting `costHealth: true` either when creating the card, or through the update function.


## Community

Sunwell is a [HearthSim](http://hearthsim.info) project. All development
happens on our IRC channel `#hearthsim` on [Freenode](https://freenode.net).


# License

Sunwell is licensed
[MIT](http://choosealicense.com/licenses/mit/). The full license text is
available in the `LICENSE` file in the respective implementations' folder.
