const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

const PROD = process.env.NODE_ENV === 'production'
const PLATFORM = process.env.PLATFORM || 'node'

const TS_LOADER = { test: /\.ts$/, loaders: ['ts-loader'] }

let plugins = [
  new webpack.DefinePlugin({
    'process.env.PLATFORM': JSON.stringify(PLATFORM)
  })
]

// if (PROD) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: true,
      mangle: false,
      beautify: true
    })
  )
//   plugins.push(new webpack.optimize.ModuleConcatenationPlugin())
// }

module.exports = [
  {
    name: 'sunwell',
    target: PLATFORM,
    entry: {
      sunwell: path.join(__dirname, 'src/Sunwell.ts')
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: PROD ? '[name].min.js' : '[name].js',
      library: 'Sunwell',
	//   libraryTarget: PLATFORM == 'web' ? 'var' : 'commonjs2'
	  libraryTarget: 'umd',
    umdNamedDefine: true
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.ts', '.js']
    },
    externals: [nodeExternals()],
    module: {
      loaders: [TS_LOADER]
    },
    plugins
  }
]
