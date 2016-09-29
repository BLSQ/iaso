var path = require('path')
var url = require('url')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
// Switch here for french. This is set to 'en' in dev to not get react-intl warnings
// remeber to switch in webpack.prod.js and
// djanog settings as well
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
    'playground': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/playground'
    ],
    'monthly_report': [
      'webpack-dev-server/client?' + WEBPACK_URL,
      'webpack/hot/only-dev-server',
      './assets/js/monthlyReport'
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
        loaders: ['react-hot', 'babel?presets[]=es2015&presets[]=react&presets[]=stage-2']
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
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
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
