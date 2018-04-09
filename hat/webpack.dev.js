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
    'styles': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/css/index.scss'
    ],
    'microplanning': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/Microplanning/index'
    ],
    'monthly_report': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/MonthlyReport/index'
    ],
    'management': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/Management/index'
    ],
    'locator': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/Locator/index'
    ],
    'vector': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/Vector/index'
    ],
    'quality_control': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/QualityControl/index'
    ],
    'stats': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/apps/Stats/index'
    ]
  },

  output: {
    library: ['HAT', '[name]'],
    libraryTarget: 'var',
    path: path.resolve(__dirname, './assets/webpack/'),
    filename: '[name].js',
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
      filename: './assets/webpack/webpack-stats.json'
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
              presets: ['es2015', 'react', 'stage-2'],
              minified: false,
              sourceMaps: true,
              sourceType: 'module'
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
      // videos
      {
        test:  /\.mp4$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'video/mp4'
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
