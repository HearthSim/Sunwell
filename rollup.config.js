import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import jscc from 'rollup-plugin-jscc'
import cleanup from 'rollup-plugin-cleanup'

const ExternalModulesList = [].concat(
  require('builtin-modules'),
  Object.keys(require('./package.json').dependencies)
)

const PLATFORM = ['web', 'cdn', 'node'].includes(process.env.PLATFORM)
  ? process.env.PLATFORM
  : 'node'
const PRODUCTION = !!process.env.PRODUCTION
export default {
  entry: 'src/Sunwell.ts',
  format: PLATFORM == 'cdn' ? 'iife' : 'cjs',
  dest: `dist/sunwell.${PLATFORM}${PRODUCTION ? '.min' : ''}.js`,
  external: ExternalModulesList,
  moduleName: 'Sunwell',
  plugins: [
    jscc({
      values: {
        _PLATFORM: PLATFORM
      },
      extensions: ['.js', '.ts']
    }),
    typescript({
      typescript: require('typescript')
    }),
    resolve(),
    commonjs({
      exclude: ExternalModulesList,
      ignoreGlobal: true,
      extensions: ['.js', '.ts']
    }),
    cleanup()
  ]
}
