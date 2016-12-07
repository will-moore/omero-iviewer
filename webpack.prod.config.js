var path = require('path');
var AureliaWebpackPlugin = require('aurelia-webpack-plugin');
var ProvidePlugin = require('webpack/lib/ProvidePlugin');
var pkg = require('./package.json');

module.exports = {
  entry: {
    main: [
      './src/main.js'
    ]
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/static/omero_iviewer/'
  },
  plugins: [
    new AureliaWebpackPlugin({nameExternalModules: false}),
    new ProvidePlugin({
      Promise: 'bluebird',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
  })],
  resolve: {
    root: [
      path.resolve('./')
    ]
  },
  module: {
    noParse: [/libs\/ol3-viewer-1.0.js$/],
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/,
        query: { compact: false, presets: ['es2015-loose', 'stage-1'], plugins: ['transform-decorators-legacy'] } },
      { test: /\.css?$/, loader: 'file?name=css/[name].[ext]' },
      { test: /\.(png|gif|jpg|jpeg)$/, loader: 'file?name=css/images/[name].[ext]' },
      { test: /\.html$/, loader: 'html' }
    ]
  }
};
