const path = require('path')
const { DefinePlugin } = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const { title } = require('./package.json')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

module.exports = {
  mode: isDev ? 'development' : 'production',
  target: 'electron-renderer',
  context: path.resolve(__dirname, 'src', 'renderer'),
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build', 'renderer')
  },
  devServer: {
    port: +process.env.PORT || 3030,
    hot: true,
    stats: 'minimal',
    overlay: true
  },
  plugins: [
    new HTMLWebpackPlugin({ title }),
    new VueLoaderPlugin(),
    new DefinePlugin({
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false'
    })
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader']
      }
    ]
  }
}
