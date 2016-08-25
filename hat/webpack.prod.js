var path = require('path')
var BundleTracker = require('webpack-bundle-tracker')

module.exports = {
  context: __dirname,

  entry: {
    'import': './assets/js/import',
    'testapp': './assets/js/testapp'
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

  module: {
    loaders: [
      // we pass the output from babel loader to react-hot loader
      { test: /\.js?$/, exclude: /node_modules/, loaders: ['react-hot', 'babel?presets[]=es2015&presets[]=react'] }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    // empty needs to be there to find external modules
    extensions: ['', '.js']
  }
}
