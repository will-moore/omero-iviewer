const path = require('path');
const {AureliaPlugin} = require('aurelia-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const pkg = require('./package.json');

module.exports = {
  entry: {
    main: [
      './src/main'
    ]
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    chunkFilename: "[chunkhash].bundle.js"
  },
  plugins: [
    new AureliaPlugin({aureliaApp: undefined, includeAll: 'src'}),
    new ProvidePlugin({
      Promise: 'bluebird',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
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
              presets: [[
                  'env', {
                      "loose": true, modules: false,
                      "targets" : {
                            "uglify": process.env.NODE_ENV === 'production'}
                    }]],
              plugins: ['istanbul', "transform-class-properties",
                        'transform-decorators-legacy'] } },
        { test: /[\/\\]node_modules[\/\\]bluebird[\/\\].+\.js$/, loader: 'expose-loader?Promise' },
        { test: require.resolve('jquery'), loader: 'expose-loader?$!expose-loader?jQuery' },
        { test: /\.css?$/, loader: 'file-loader?name=css/[name].[ext]' },
        { test: /\.(png|gif|jpg|jpeg)$/, loader: 'file-loader?name=css/images/[name].[ext]' },
        { test: /\.(woff|woff2)$/, loader: 'file-loader?name=css/fonts/[name].[ext]' },
        { test: /\.html$/, loader: 'html-loader' }
    ]
  }
};
