var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var CommonsPlugin = require("webpack/lib/optimize/CommonsChunkPlugin")

module.exports = {
  context: __dirname,

  entry: {
    'common': ['react'],
    'import': './assets/js/import',
    'testapp': './assets/js/testapp',
    'styles': './assets/css/index.css'
  },

  output: {
    path: path.resolve(__dirname, './assets/bundles'),
    filename: '[name]-[chunkhash].js'
  },

  plugins: [
    new webpack.optimize.DedupePlugin(),
    new BundleTracker({
      path: __dirname,
      filename: './assets/bundles/webpack-stats.json'
    }),
    new ExtractTextPlugin("[name]-[chunkhash].css"),
    new CommonsPlugin({
      minChunks: 3,
      name: "common"
    }),
    new webpack.DefinePlugin({
      'process.env': {
        // This has effect on the react lib size
        'NODE_ENV': 'production'
      }
    }),
    // Minification
    new webpack.optimize.UglifyJsPlugin()
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
        loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      // Extract Sass files
      {
        test: /\.sass$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader")
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    // empty needs to be there to find external modules
    extensions: ['', '.js']
  }
}
