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
    'playground': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/playground'
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
    'suspect_cases': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/suspectCases'
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
    new webpack.NoErrorsPlugin(), // don't reload if there is an error
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
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
        loaders: ['react-hot-loader/webpack', 'babel?presets[]=es2015&presets[]=react&presets[]=stage-2']
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      // Extract Sass files
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
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
      // images
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
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
      },
      // favicon
      {
        test: 'images/favicon-dev.png',
        loader: 'url',
        query: {
          name: 'favicon.png'
        }
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
}
