import typescript from "rollup-plugin-typescript"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import jscc from "rollup-plugin-jscc"
import cleanup from "rollup-plugin-cleanup"


const ExternalModulesList = (() => {
	return [].concat(
		require("builtin-modules"),
		Object.keys(require("./package.json").dependencies)
	)
})()

const PLATFORM = process.env.BROWSER ? "web" : "node"

export default {
	entry: "src/Sunwell.ts",
	format: PLATFORM == "web" ? "iife" : "cjs",
	dest: `dist/sunwell.${PLATFORM}.js`,
	external: ExternalModulesList,
	moduleName: "Sunwell",
	plugins: [
		jscc({
			values: {
				_PLATFORM: PLATFORM
			},
			extensions: [".js", ".ts"]
		}),
		typescript({
			typescript: require("typescript")
		}),
		resolve(),
		commonjs({
			exclude: ExternalModulesList,
			ignoreGlobal: true,
			extensions: [".js", ".ts"]
		}),
		cleanup()
	]
}
