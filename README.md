Sunwell
=======

A HTML5 canvas based renderer for hearthstone cards.
This works in your browser through javascript.

Requirements
------------

Obviously, you need a couple of graphical assets to make this renderer work.

I prepared a couple of skeleton assets for the cards via Photoshop, but the main card artworks are not
included in this repository. In order to render cards, you need to obtain the card artworks and place
them in the `/artwork` folder.

You also need to obtain a copy of the Belwe font as its being used to render the cards title and number
values. You can place the web font files in the `/font` directory. A substitute for the card body text
font will be loaded from google fonts.



Usage
-----

Simply load the `sunwell.js` inside a html document and it will load the requirements on its own.

	<script src="sunwell.js">
	
After being loaded, sunwell will provide the global object `sunwell` for you to interact with and
generate cards from.


###Rendering a card
To render a specific card, you can call the method `createCard()` of the global `sunwell` object.

	var cardObj = sunwell.createCard(cardData, width, [renderTarget]);
	
The `cardData` parameter is an object containing information about the card to be rendered. `width`
defines the width of the card to be rendered. Sunwell provides a "native" resolution up to 764x1100
pixels. While you can set a higher value than 764 for the desired render, it will only result in blurry
results. The max supported resolution of sunwell is already by far greater than in the game itself.

The `renderTarget` parameter is the only one thats optional. Pass a previously created Image object 
here, to have the rendered result in there. If you don't provide such an object, sunwell will create one.

The object you pass as `cardData` can be obtained for example through [HearthstoneJSON](https://hearthstonejson.com/).

```javascript
{
	"id":"CS2_087",
	"artist":"Zoltan Boros",
	"set":"CORE",
	"type":"SPELL",
	"rarity":"FREE",
	"cost":1,
	"name":"Blessing of Might",
	"flavor":"\"As in, you MIGHT want to get out of my way.\" - Toad Mackle, recently buffed.",
	"playRequirements":{"REQ_TARGET_TO_PLAY":0,"REQ_MINION_TARGET":0},
	"collectible":true,
	"playerClass":"PALADIN",
	"howToEarnGolden":"Unlocked at Level 45.",
	"howToEarn":"Unlocked at Level 1.",
	"text":"Give a minion +3 Attack.",
	"texture":"W16_a053_D"
}
```

Some properties are purely optional, since they are not used by sunwell, but these ones are required:

```javascript
{
	"id":"CS2_087",
	"set":"CORE",
	"type":"SPELL",
	"rarity":"FREE",
	"cost":1,
	"name":"Blessing of Might",
	"playerClass":"PALADIN",
	"text":"Give a minion +3 Attack.",
	"texture":"W16_a053_D"
}
```

In case of a minion or weapon card, you also need to pass `health` and/or `attack`.

The method will return an object that provides an interface to manipulate the card after its creation.

You can also access the image object that contains the cards image data through `cardObj.target`.

If you want to update certain properties on the original `cardData`, simply call `cardObj.update()` and
pass an object with the properties you want to overwrite.

If you update the `cost`, `health` and/or `attack` properties, the numbers will turn green and/or red
on the card image, depending on the original value.

