var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CommonsPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
var LOCALE = 'fr'

module.exports = {
  // fail the entire build on 'module not found'
  bail: true,
  context: __dirname,

  entry: {
    'common': ['react', 'react-dom', 'react-intl'],
    'styles': './assets/css/index.scss',
    'microplanning': './assets/js/apps/Microplanning/index',
    'monthly_report': './assets/js/apps/MonthlyReport/index',
    'stats': './assets/js/apps/Stats/index',
    'teams_devices': './assets/js/apps/TeamsDevices/index',
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
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
    new ExtractTextPlugin({filename: '[name]-[chunkhash].css'}),
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
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new webpack.LoaderOptionsPlugin({ minimize: true }),
    // XLSX
    new webpack.IgnorePlugin(/cptable/)
  ],

  module: {
    rules: [
      // we pass the output from babel loader to react-hot loader
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'react-hot-loader/webpack' },
          {
            loader: 'babel-loader',
            options: {
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
            }
          }
        ]
      },
      // Extract Sass files
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader' },
            { loader: 'sass-loader' }
          ]
        })
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      // font files
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff'
        }
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff'
        }
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/octet-stream'
        }
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'image/svg+xml'
        }
      },
      // Leaftlet images
      {
        test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'image/png'
        }
      }
    ]
  },

  // https://github.com/SheetJS/js-xlsx/issues/285
  node: { fs: 'empty' },
  externals: [{ './cptable': 'var cptable' }],

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js']
  }
}
