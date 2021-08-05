var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
// Switch here for french. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
var LOCALE = 'fr';
var WEBPACK_URL = 'http://localhost:3000';

const pluginsString = process.env.PLUGINS || '';
const plugins = pluginsString.split(',');

module.exports = {
    context: __dirname,
    mode: 'development',
    target: ['web', 'es2017'],
    entry: {
        // use same settings as in Prod
        common: ['react', 'react-dom', 'react-intl'],
        styles: ['./assets/css/index.scss'],
        iaso: ['./assets/js/apps/Iaso/index'],
    },

    output: {
        path: path.resolve(__dirname, './assets/webpack/'),
        filename: '[name].js',
        publicPath: WEBPACK_URL + '/static/', // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
    },

    // config for webpack-dev-server
    devServer: {
        publicPath: WEBPACK_URL + '/static/',
        hot: false,
        inline: false,
        historyApiFallback: true,
        https: false,
        // It suppress error shown in console, so it has to be set to false.
        quiet: false,
        // It suppress everything except error, so it has to be set to false as well
        // to see success build.
        noInfo: false,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        port: 3000,
        stats: {
            // Config for minimal console.log mess.
            assets: false,
            colors: true,
            version: false,
            hash: false,
            timings: false,
            chunks: false,
            chunkModules: false,
        },
    },

    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /^__intl\/messages\/en$/,
            '../translations/en.json',
        ),
        new webpack.NormalModuleReplacementPlugin(
            /^__intl\/messages\/fr$/,
            '../translations/fr.json',
        ),
        new webpack.NoEmitOnErrorsPlugin(), // don't reload if there is an error
        new BundleTracker({
            path: __dirname,
            filename: './assets/webpack/webpack-stats.json',
        }),
        new webpack.DefinePlugin({
            'process.env': {
                PLUGINS_KEYS: JSON.stringify(plugins),
            },
            __LOCALE: JSON.stringify(LOCALE),
        }),
        // XLSX
        new webpack.IgnorePlugin(/cptable/),
    ],

    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                            ],
                            plugins: [['@babel/transform-runtime']],
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
            },
            // Extract Sass files
            {
                test: /\.scss$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    { loader: 'sass-loader' },
                ],
            },
            // font files
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'application/font-woff',
                },
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'application/font-woff',
                },
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'application/octet-stream',
                },
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
            },
            // images
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'image/svg+xml',
                },
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader',
                options: {
                    limit: 8192,
                },
            },
            // videos
            {
                test: /\.mp4$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'video/mp4',
                },
            },
            // Leaftlet images
            {
                test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'image/png',
                },
            },
        ],
    },
    externals: [{ './cptable': 'var cptable' }],

    resolve: {
        fallback: {
            fs: false,
        },
        modules: ['node_modules'],
        extensions: ['.js'],
    },
};
