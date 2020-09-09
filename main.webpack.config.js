const path = require('path')
const { DefinePlugin } = require('webpack')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

module.exports = {
  mode: isDev ? 'development' : 'production',
  target: 'electron-main',
  context: path.resolve(__dirname, 'src', 'main'),
  entry: './main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build', 'main')
  },
  plugins: [new DefinePlugin({
    __DEV__: isDev
  })]
}
