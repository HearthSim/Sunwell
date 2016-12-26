const path = require("path");
const webpack = require("webpack");


var PROD = process.env.NODE_ENV === "production";

module.exports = {
	entry: {
		sunwell: path.join(__dirname, "src/Sunwell.ts"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: PROD ? "[name].min.js" : "[name].js",
		library: "Sunwell",
		libraryTarget: "var",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js"],
	},
	module: {
		loaders: [
			{
				test: /\.ts$/,
				loaders: [
					"ts-loader",
				],
			},
		],
	},
	target: "web",
	plugins: PROD ? [
		new webpack.optimize.UglifyJsPlugin({minimize: true}),
	] : [],
};
