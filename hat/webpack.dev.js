var path = require('path')
var url = require('url')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
// Switch here for french
// remeber to switch in webpack.prod.js and
// djanog settings as well
// var LOCALE='fr'
var LOCALE = 'en'

// When DOCKER_HOST is set we'll use its hostname for the webpack url
var WEBPACK_URL = process.env.DOCKER_HOST
    ? url.format({
      protocol: 'http',
      hostname: url.parse(process.env.DOCKER_HOST).hostname,
      port: 3000
    })
    : 'http://localhost:3000'

module.exports = {
  context: __dirname,
  entry: {
    // Empty module stand-in for Prod Bundle
    'common': [],
    'import': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/import'
    ],
    'testapp': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/testapp'
    ],
    'styles': './assets/css/index.scss'
  },

  output: {
    path: path.resolve(__dirname, './assets/bundles/'),
    filename: '[name]-[hash].js',
    publicPath: WEBPACK_URL + '/static/' // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
  },

  plugins: [
    // provide intl modules depending on locale
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/localeData$/,
      'react-intl/locale-data/' + LOCALE
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/messages$/,
      '../translations/' + LOCALE + '.json'
    ),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(), // don't reload if there is an error
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
    new ExtractTextPlugin('[name]-[chunkhash].css'),
    new webpack.DefinePlugin({
      '__LOCALE': JSON.stringify(LOCALE)
    })
  ],

  module: {
    loaders: [
      // we pass the output from babel loader to react-hot loader
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel?presets[]=es2015&presets[]=react']
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
      },
      // Extract Sass files
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader', 'sass-loader')
      },
      // JSON loader for translations
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
}
