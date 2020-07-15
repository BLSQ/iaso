var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
var LOCALE = 'fr'

module.exports = {
  // fail the entire build on 'module not found'
  bail: true,
  context: __dirname,
  mode: 'production',

  entry: {
    'common': ['react', 'react-dom', 'react-intl'],
    'styles': './assets/css/index.scss',
    'iaso': './assets/js/apps/Iaso/index',
  },

  output: {
    library: ['HAT', '[name]'],
    libraryTarget: 'var',
    path: path.resolve(__dirname, './assets/webpack'),
    filename: '[name]-[chunkhash].js'
  },

  plugins: [
    // provide intl modules depending on locale
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/localeData\/en$/,
      'react-intl/locale-data/en'
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/messages\/en$/,
      '../translations/en.json'
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/localeData\/fr$/,
      'react-intl/locale-data/fr'
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^__intl\/messages\/fr$/,
      '../translations/fr.json'
    ),
    new BundleTracker({
      path: __dirname,
      filename: './assets/webpack/webpack-stats-prod.json'
    }),
    new MiniCssExtractPlugin({filename: '[name]-[chunkhash].css'}),
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
    new webpack.LoaderOptionsPlugin({ minimize: true }),
    // XLSX
    new webpack.IgnorePlugin(/cptable/)
  ],

  optimization: {
    minimize: true, // old UglifyJsPlugin
    namedModules: true, // old NamedModulesPlugin()
    splitChunks: { // old CommonsChunkPlugin
      cacheGroups: {
        commons: {
          // name: 'commons',
          // chunks: 'initial',
          minChunks: 3
        }
      }
    }
    // runtimeChunk: true,
    // concatenateModules: true // old ModuleConcatenationPlugin
  },

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
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
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
