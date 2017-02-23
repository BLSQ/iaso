var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
// Switch here for french. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
var LOCALE = 'en'
var WEBPACK_URL = 'https://localhost:3000'

module.exports = {
  context: __dirname,
  entry: {
    // use same settings as in Prod
    'common': ['react', 'react-dom', 'react-intl'],
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
    'stats': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/stats'
    ],
    'monthly_report': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/monthlyReport'
    ],
    'microplanning': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/microplanning'
    ],
    'styles': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/css/index.scss'
    ]
  },

  output: {
    library: ['HAT', '[name]'],
    libraryTarget: 'var',
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
      // Don't include the english translations, it will
      // mess up text updates via hot module reloading
      '../translations/' + LOCALE + '.json'
    ),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(), // don't reload if there is an error
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
    new webpack.DefinePlugin({
      '__LOCALE': JSON.stringify(LOCALE)
    }),
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
              presets: ['es2015', 'react', 'stage-2']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      // Extract Sass files
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' }
        ]
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
      // images
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'image/svg+xml'
        }
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader',
        options: {
          limit: 8192
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
      },
      // favicon
      {
        test: 'images/favicon-dev.png',
        loader: 'url-loader',
        options: {
          name: 'favicon.png'
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
