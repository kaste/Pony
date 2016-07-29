import babel from 'rollup-plugin-babel'

export default {
  format: 'iife',
  moduleName: 'Pony.decorators',
  entry: 'decorators/index.js',
  dest: 'build/Pony.decorators.js',
  plugins: [ babel() ]
}