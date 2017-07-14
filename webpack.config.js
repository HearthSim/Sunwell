const path = require("path");
const webpack = require("webpack");


var PROD = process.env.NODE_ENV === "production";
var MINIFY = new webpack.optimize.UglifyJsPlugin({minimize: true});
// var MINIFY = new webpack.optimize.UglifyJsPlugin({minimize: true});


module.exports = [{
	target: "web",
	entry: {
		sunwell: path.join(__dirname, "src/Sunwell.ts"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: PROD ? "sunwell.min.js" : "sunwell.js",
		library: "Sunwell",
		libraryTarget: "var",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js"],
	},
	module: {
		loaders: [{
			test: /\.ts$/,
			loaders: ["ts-loader"],
		}],
	},
	plugins: [
		new webpack.DefinePlugin({"process.env": {"PLATFORM": "web"}}),
	],
}, {
	target: "node",
	entry: {
		sunwell: path.join(__dirname, "index.js"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js", ".node"],
	},
	node: {
		"__dirname": false,
		"__filename": false,
		"fs": "empty",
	},
	module: {
		loaders: [
			{
				test: /\.ts$/,
				loaders: ["ts-loader"],
			}, {
				test: /\.node$/,
				loaders: ["node-loader"],
			}
		],
	},
	plugins: [
		new webpack.DefinePlugin({"process.env": {"PLATFORM": "node"}}),
	],
}];

