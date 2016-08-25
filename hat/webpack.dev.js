var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

module.exports = {
  context: __dirname,
  entry: {
    'import': [
      'webpack-dev-server/client?http://localhost:3000',
      'webpack/hot/only-dev-server',
      './assets/js/import'
    ],
    'testapp': [
      'webpack-dev-server/client?http://localhost:3000',
      'webpack/hot/only-dev-server',
      './assets/js/testapp'
    ]
  },

  output: {
    path: path.resolve(__dirname, './assets/bundles/'),
    filename: '[name]-[hash].js',
    publicPath: 'http://localhost:3000/bundles/' // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(), // don't reload if there is an error
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
    extensions: ['', '.js', '.jsx']
  }
}
