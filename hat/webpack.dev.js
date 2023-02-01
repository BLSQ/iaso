const path = require('path');
const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
// Switch here for French. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
const LOCALE = 'fr';

// If you launch the dev server with `WEBPACK_HOST=192.168.1.XXX  npm run dev`
// where 192.168.1.XXX is your local IP address, you can access the dev server
// from another device on the same network, typically from a mobile device or tablet
if (process.env.WEBPACK_HOST !== undefined) {
    WEBPACK_HOST = process.env.WEBPACK_HOST;
} else {
    WEBPACK_HOST = 'localhost';
}

const WEBPACK_URL = `http://${WEBPACK_HOST}:3000`;

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
            'typescript',
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
        sourceMapFilename: '[name].js.map',
        publicPath: `${WEBPACK_URL}/static/`, // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
    },
    devtool: 'source-map',

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
        new webpack.WatchIgnorePlugin({
            paths: [/\.d\.ts$/],
        }),
    ],

    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: /node_modules/,
            },
            {
                test: /\.(ts|tsx)?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            presets: [
                                [
                                    '@babel/preset-env',
                                    { targets: { node: '14' } },
                                ],
                                '@babel/preset-react',
                                [
                                    '@babel/preset-typescript',
                                    { isTSX: true, allExtensions: true },
                                ],
                            ],
                            plugins: ['@babel/transform-runtime', 'formatjs'],
                            // include: ['../plugins/polio/js/']
                        },
                    },
                ],
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
                            // include: ['../plugins/polio/js/']
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
        noParse: [require.resolve('typescript/lib/typescript.js')], // remove warning: https://github.com/microsoft/TypeScript/issues/39436
    },
    externals: [{ './cptable': 'var cptable' }],

    resolve: {
        alias: {
            // see LIVE_COMPONENTS feature in doc
            ...(process.env.LIVE_COMPONENTS === 'true' && {
                'bluesquare-components': path.resolve(
                    __dirname,
                    '../../bluesquare-components/src/',
                ),
            }),
        },
        fallback: {
            fs: false,
        },
        modules:
            process.env.LIVE_COMPONENTS === 'true'
                ? [
                      'node_modules',
                      '../../bluesquare-components/node_modules/',
                      path.resolve(__dirname, 'assets/js/apps/'),
                  ]
                : /* assets/js/apps path allow using absolute import eg: from 'iaso/libs/Api' */
                  ['node_modules', path.resolve(__dirname, 'assets/js/apps/')],

        extensions: ['.js', '.tsx', '.ts'],
    },
};
