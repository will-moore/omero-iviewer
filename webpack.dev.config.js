const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {AureliaPlugin} = require('aurelia-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');

module.exports = {
  devServer: {
    host: 'localhost',
    port: 3000
  },
  entry: {
    main: [
      './src/main'
    ]
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js'
  },
  plugins: [
    new AureliaPlugin({aureliaApp: undefined}),
    new ProvidePlugin({
        Promise: 'bluebird',
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    }),
    new HtmlWebpackPlugin({
      template : './src/index-dev.html',
      filename: 'index.html'
  })],
  resolve: {
      extensions: [".js"],
         modules: ["src", "node_modules"]
  },
  module: {
    noParse: [/libs\/ol3-viewer.js$/],
    rules: [
        { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/,
          query: { compact: false,
              presets: [['env', {"loose": true, modules: false}]],
              plugins: ['istanbul', "transform-class-properties",
                        'transform-decorators-legacy'] } },
      { test: /\.css?$/, loader: 'file-loader?name=css/[name].[ext]' },
      { test: /\.(png|gif|jpg|jpeg)$/, loader: 'file-loader?name=css/images/[name].[ext]' },
      { test: /\.(woff|woff2)$/, loader: 'file-loader?name=css/fonts/[name].[ext]' },
      { test: /\.html$/, loader: 'html-loader' }
    ]
  }
};
