var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

module.exports = {
  context: __dirname,

  entry: {
    'import': './assets/js/import',
  },

  output: {
    path: path.resolve(__dirname, './assets/bundles'),
    filename: '[name]-[hash].js'
  },

  plugins: [
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    })
  ],

  resolve: {
    // modulesDirectories: ['node_modules'],
    extensions: ['.js']
  }
}
