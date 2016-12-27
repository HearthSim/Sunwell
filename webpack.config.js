const path = require("path");
const webpack = require("webpack");


var PROD = process.env.NODE_ENV === "production";
var MINIFY = new webpack.optimize.UglifyJsPlugin({minimize: true});
var TS_LOADER = {test: /\.ts$/, loaders: ["ts-loader"]};

module.exports = [{
	name: "sunwell",
	target: "web",
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
		loaders: [TS_LOADER],
	},
	plugins: PROD ? [MINIFY] : [],
}, {
	name: "node-sunwell",
	target: "node",
	entry: {
		sunwell: path.join(__dirname, "src/Sunwell.ts"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "node-sunwell.js",
		library: "Sunwell",
		libraryTarget: "commonjs2",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js"],
	},
	module: {
		loaders: [TS_LOADER],
	},
	plugins: PROD ? [MINIFY] : [],
}];
