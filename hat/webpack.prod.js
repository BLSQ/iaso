var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CommonsPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
// Switch here for french
// remeber to switch in webpack.dev.js and
// djanog settings as well
var LOCALE = 'fr'

module.exports = {
  // fail the entire build on 'module not found'
  bail: true,
  context: __dirname,

  entry: {
    'common': ['react', 'react-dom', 'react-intl'],
    'import': './assets/js/import',
    'testapp': './assets/js/testapp',
    'playground': './assets/js/playground',
    'stats': './assets/js/stats',
    'monthly_report': './assets/js/monthlyReport',
    'suspect_cases': './assets/js/suspectCases',
    'gis_tools': './assets/js/gisTools',
    'styles': './assets/css/index.scss'
  },

  output: {
    library: ['HAT', '[name]'],
    libraryTarget: 'var',
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
        loaders: ['react-hot-loader/webpack', 'babel?' + JSON.stringify({
          presets: [
            'es2015',
            'react',
            'stage-2'
          ],
          plugins: [
            ['react-intl', {
              'messagesDir': path.join(__dirname, '/assets/messages')
            }]
          ]
        })]
      },
      // Extract Sass files
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css!sass')
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css')
      },
      // font files
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream'
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      },
      // JSON loader for translations
      {
        test: /\.json$/,
        loader: 'json'
      },
      // Leaftlet images
      {
        test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/png'
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    // empty needs to be there to find external modules
    extensions: ['', '.js']
  }
}
