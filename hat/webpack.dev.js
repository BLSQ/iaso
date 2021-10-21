const path = require('path');
const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
// Switch here for french. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
const LOCALE = 'fr';
const WEBPACK_URL = 'http://localhost:3000';

module.exports = {
    context: __dirname,
    mode: 'development',
    target: 'web',
    entry: {
        // use same settings as in Prod
        common: [
            'react',
            'bluesquare-components',
            'react-dom',
            'react-intl',
            '@material-ui/core',
            // Don't include, it packs all the icon instead of actually used one
            // '@material-ui/icons',
            '@material-ui/lab',
            '@material-ui/pickers',
            'lodash',
            'moment',
            'leaflet',
            'leaflet-draw',
            'react-redux',
            'prop-types',
            'video.js',
        ],
        styles: ['./assets/css/index.scss'],
        iaso: {
            dependOn: 'common',
            import: './assets/js/apps/Iaso/index',
        },
    },

    output: {
        path: path.resolve(__dirname, './assets/webpack/'),
        filename: '[name].js',
        publicPath: `${WEBPACK_URL}/static/`, // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
    },

    // config for webpack-dev-server
    devServer: {
        historyApiFallback: true,
        noInfo: false,
        // needed so we can load the js from django (on another port or docker)
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        host: '0.0.0.0',
        port: 3000,
        // It suppress error shown in console, so it has to be set to false.
        quiet: false,
        // It suppress everything except error, so it has to be set to false as well
        // to see success build.
        stats: {
            // Config for minimal console.log mess.
            assets: true,
            colors: true,
            version: false,
            hash: false,
            timings: true,
            chunks: true,
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
                            plugins: ['@babel/transform-runtime', 'formatjs'],
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
        alias: {
            'bluesquare-components': path.resolve(
                __dirname,
                '../../../bluesquare-components/src/',
            ),
        },
        fallback: {
            fs: false,
        },
        modules: [
            'node_modules',
            '../../../bluesquare-components/node_modules/',
        ],
        extensions: ['.js'],
    },
};
