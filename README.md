# Sunwell

A high quality Hearthstone card renderer in TypeScript.

* Use it as a Javascript library in the browser to render to a `<canvas>` element.
* Or in NodeJS using [node-canvas](https://github.com/Automattic/node-canvas)


## Download

The latest, minified version of Sunwell is available here:

https://sunwell.hearthsim.net/branches/master/sunwell.js


## Requirements

The following dependencies are required to build Sunwell:

- [Yarn](https://github.com/yarnpkg/yarn)
- [Webpack](https://github.com/webpack/webpack)

Run `yarn install` to install the dependencies. Then, run `webpack` to build
the project into `dist/sunwell.js`.

If you run `NODE_ENV=production webpack`, it will instead build a minified
version into `dist/sunwell.min.js`.

The assets in the `assets/` folder can be copied as-is.

Sunwell currently has no runtime dependencies outside of Webpack.


### Fonts

To create faithful renders, the Belwe and Franklin Gothic proprietary fonts are required.
Make sure to obtain a license if you wish to distribute cards rendered with them.

Sunwell should work with any fallback font you give it.


## Usage

Instanciate a new `Sunwell` object as such:

```js
var sunwell = new Sunwell(options);
```

The `options` object is defined further down.

To render a card, you can use `Sunwell.createCard(card)`.
Sunwell aims to be compatible with [HearthstoneJSON](https://hearthstonejson.com).
You can pass a `card` object from the HearthstoneJSON API as-is and get a usable card in return.


```js
var card = sunwell.createCard(card, width, target);
```

`width` is the size of the render (height is determined automatically).
The `target` argument should be a Canvas or Image object the render will be applied to.

Internally, Sunwell renders to a Canvas already. If you target an image, the conversion
to PNG and compression will result in performance loss with frequent updates.
Rendering to a Canvas is more direct, however will likely result in performance degradation
with large amounts of cards on screen. Pick your poison.


### Sunwell options

The following options can be forwarded to the Sunwell instance:

- `debug` (boolean: `false`): If `true`, extra output will be logged.
- `titleFont` (string: `"Belwe"`): The font to use for the card's name.
- `bodyFont` (string: `"Franklin Gothic"`): The font to use for the card's body.
- `assetFolder` (string: `"/assets/"`): The path to the assets folder.
- `cacheSkeleton` (boolean: `false`): Whether to cache the card's frame render (slow).
- `drawTimeout` (number: `5000`): The maximum amount of milliseconds Sunwell will spend
  rendering any single card before giving up.
- `maxActiveRenders` (number: `12`): How many concurrent renders Sunwell will perform.


### Card properties

The following card properties are supported:

- `name` (string): The card's name
- `text` (string): The card's body text
- `collectionText` (string): The card's body text. Has precedence over `text`.
- `raceText` (string): The card's race as a string. Has precedence over `race`.
- `cost` (number): The card's cost.
- `attack` (number): The card's attack value (has no effect for spells).
- `health` (number): The card's health value (has no effect for spells).
- `costsHealth` (boolean): Set to true to render the card's cost as health.
- `hideStats` (boolean): Set to true to hide the attack/health textures and the cost value.
- `silenced` (boolean): Set to true to show the card as silenced (card text crossed out).
- `language` (string): The language of the card. Only used to determine the race text for enums.


Enums are standard Hearthstone enums. They can be passed as an int (preferred) or as their
string variant:

- `type` (enum CardType): The card's type (only MINION, SPELL and WEAPON are supported).
- `playerClass` (enum CardClass): The card's class. This determines the card frame to use.
- `set` (enum CardSet): Determines the body text background watermark.
- `rarity` (enum Rarity): Determines the card's rarity gem. Note that COMMON cards from the
  CORE set will not show a rarity gem, despite not being FREE.
- `multiClassGroup` (enum MultiClassGroup): Determines the card's multiclass banner.
- `race` (enum Race): The card's race.

Finally, a `texture` property should be passed as well, for the card art. The texture may be
a string, in which case it's treated as a URL, or it may be an Image. If null, an empty grey
texture will be created in its place.

NOTE: Some properties only affect certain card types unless explicitly set on the card
itself. For example, a spell or weapon will not render a race text even if given one.


## Community

Sunwell is a [HearthSim](https://hearthsim.info) project. All development
happens on our IRC channel `#hearthsim` on [Freenode](https://freenode.net).


# License

This project is licensed under the MIT license. The full license text is
available in the LICENSE file.

The assets directory includes files that are copyright © Blizzard Entertainment.
