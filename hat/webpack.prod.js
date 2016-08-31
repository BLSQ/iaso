var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CommonsPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
// Switch here for french
// remeber to switch in webpack.dev.js and
// djanog settings as well
// var LOCALE='fr'
var LOCALE = 'en'

module.exports = {
  // fail the entire build on 'module not found'
  bail: true,
  context: __dirname,

  entry: {
    'common': ['react', 'react-dom', 'react-intl'],
    'import': './assets/js/import',
    'testapp': './assets/js/testapp',
    'styles': './assets/css/index.scss'
  },

  output: {
    path: path.resolve(__dirname, './assets/bundles'),
    filename: '[name]-[chunkhash].js'
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
    new webpack.optimize.DedupePlugin(),
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
    new ExtractTextPlugin('[name]-[chunkhash].css'),
    new CommonsPlugin({
      minChunks: 3,
      name: 'common'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        // This has effect on the react lib size
        // need to do JSON stringify on all vars here to take effect,
        // see https://github.com/eHealthAfrica/guinea-connect-universal-app/blob/development/webpack/prod.config.js
        'NODE_ENV': JSON.stringify('production')
      },
      '__LOCALE': JSON.stringify(LOCALE)
    }),
    // Minification
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
  ],

  module: {
    loaders: [
      // we pass the output from babel loader to react-hot loader
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel?' + JSON.stringify({
          presets: [
            'es2015',
            'react'
          ],
          plugins: [
            ['react-intl', {
              'messagesDir': path.join(__dirname, '/assets/messages')
            }]
          ]
        })]
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
    // empty needs to be there to find external modules
    extensions: ['', '.js']
  }
}
