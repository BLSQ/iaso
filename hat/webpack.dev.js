var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
// Switch here for french. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
var LOCALE = 'fr';
var WEBPACK_URL = 'http://localhost:3000';

module.exports = {
    context: __dirname,
    mode: 'development',
    target: ['web', 'es2017'],
    entry: {
        // use same settings as in Prod
        common: ['react', 'react-dom', 'react-intl'],
        styles: [
            'webpack-dev-server/client?' + WEBPACK_URL,
            './assets/css/index.scss',
        ],
        iaso: [
            'webpack-dev-server/client?' + WEBPACK_URL,
            './assets/js/apps/Iaso/index',
        ],
    },

    output: {
        library: ['HAT', '[name]'],
        libraryTarget: 'var',
        path: path.resolve(__dirname, './assets/webpack/'),
        filename: '[name].js',
        publicPath: WEBPACK_URL + '/static/', // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
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
            __LOCALE: JSON.stringify(LOCALE),
            'process.env.PLUGIN_POLIO_ENABLED': JSON.stringify(
                process.env.PLUGIN_POLIO_ENABLED,
            ),
        }),
        // XLSX
        new webpack.IgnorePlugin(/cptable/),
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
