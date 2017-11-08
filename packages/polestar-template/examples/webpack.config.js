var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

function isDirectory(dir) {
  return fs.lstatSync(dir).isDirectory();
}

module.exports = {

  devtool: 'inline-source-map',

  entry: fs.readdirSync(__dirname).reduce(function (entries, dir) {
    var isDraft = dir.charAt(0) === '_' || dir.indexOf('components') >= 0;
    
    if (!isDraft && isDirectory(path.join(__dirname, dir))) {
      entries[dir] = path.join(__dirname, dir, 'index.js');
    }

    return entries;
  }, {}),

  output: {
    path: path.resolve(__dirname, '__build__'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    publicPath: '/__build__/'
  },

  module: {
    rules: [
      { test: /\.(js|jsx)$/, exclude: path.resolve(__dirname, 'node_modules'), loader: 'babel-loader' }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('commons')
  ]

};