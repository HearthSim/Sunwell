const path = require("path");
const webpack = require("webpack");


var MINIFY = new webpack.optimize.UglifyJsPlugin({minimize: true});

module.exports = {
	name: "sunwell-card-renderer",
	target: "node",
	entry: {
		sunwell: path.join(__dirname, "sunwell-card-renderer.js"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "sunwell-card-renderer.js",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js", ".node"],
	},
	node: {
		"fs": "empty",
	},
	module: {
		loaders: [
			{
				test: /\.ts$/,
				loaders: [
					"ts-loader",
				],
			}, {
				test: /\.node$/,
				loaders: ["node-loader"],
			}
		],
	},
	plugins: [/*MINIFY*/], // ES6 unsupported by uglifyjs
};
