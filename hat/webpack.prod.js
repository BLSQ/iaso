const path = require('path');
const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
const LOCALE = 'fr';
module.exports = {
    // fail the entire build on 'module not found'
    bail: true,
    context: __dirname,
    mode: 'production',
    target: ['web', 'es2015'],
    entry: {
        common: ['react', 'react-dom', 'react-intl', 'typescript'],
        styles: './assets/css/index.scss',
        iaso: './assets/js/apps/Iaso/index',
    },

    output: {
        path: path.resolve(__dirname, './assets/webpack'),
        filename: '[name]-[chunkhash].js',
        publicPath: '',
    },
    devtool: 'source-map',

    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /^__intl\/messages\/en$/,
            '../translations/en.json',
        ),
        new webpack.NormalModuleReplacementPlugin(
            /^__intl\/messages\/fr$/,
            '../translations/fr.json',
        ),
        new BundleTracker({
            path: __dirname,
            filename: './assets/webpack/webpack-stats-prod.json',
        }),
        new MiniCssExtractPlugin({ filename: '[name]-[chunkhash].css' }),
        new webpack.DefinePlugin({
            'process.env': {
                // This has effect on the react lib size
                // need to do JSON stringify on all vars here to take effect,
                // see https://github.com/eHealthAfrica/guinea-connect-universal-app/blob/development/webpack/prod.config.js
                NODE_ENV: JSON.stringify('production'),
            },
            __LOCALE: JSON.stringify(LOCALE),
        }),
        // Minification
        new webpack.LoaderOptionsPlugin({ minimize: true }),
        new webpack.WatchIgnorePlugin({
            paths: [/\.d\.ts$/],
        }),
    ],

    optimization: {
        minimize: true, // old UglifyJsPlugin
        splitChunks: {
            // old CommonsChunkPlugin
            cacheGroups: {
                commons: {
                    // name: 'commons',
                    // chunks: 'initial',
                    minChunks: 3,
                },
            },
        },
        // runtimeChunk: true,
        // concatenateModules: true // old ModuleConcatenationPlugin
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                include: [
                    path.resolve(__dirname, '../node_modules/react-leaflet'),
                    path.resolve(__dirname, '../node_modules/@react-leaflet'),
                    path.resolve(__dirname, '../node_modules/@dnd-kit'),
                    path.resolve(__dirname, '../plugins'),
                    path.resolve(__dirname, 'assets'),
                ],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            node: '12',
                                            chrome: '55',
                                            ie: '11',
                                        },
                                        include: [
                                            '@babel/plugin-proposal-optional-chaining',
                                            '@babel/plugin-proposal-nullish-coalescing-operator',
                                            '@babel/plugin-proposal-numeric-separator',
                                            '@babel/plugin-proposal-logical-assignment-operators',
                                            '@babel/plugin-transform-destructuring',
                                        ],
                                    },
                                ],
                                '@babel/preset-react',
                            ],
                            plugins: [
                                [
                                    'formatjs',
                                    {
                                        messagesDir: path.join(
                                            __dirname,
                                            '/assets/messages',
                                        ),
                                    },
                                ],
                            ],
                        },
                    },
                ],
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
                                    {
                                        targets: {
                                            node: '12',
                                            chrome: '55',
                                            ie: '11',
                                        },
                                        include: [
                                            '@babel/plugin-proposal-optional-chaining',
                                            '@babel/plugin-proposal-nullish-coalescing-operator',
                                            '@babel/plugin-proposal-numeric-separator',
                                            '@babel/plugin-proposal-logical-assignment-operators',
                                            '@babel/plugin-transform-destructuring',
                                        ],
                                    },
                                ],
                                [
                                    '@babel/preset-typescript',
                                    { isTSX: true, allExtensions: true },
                                ],
                                '@babel/preset-react',
                            ],
                            plugins: [
                                [
                                    'formatjs',
                                    {
                                        messagesDir: path.join(
                                            __dirname,
                                            '/assets/messages',
                                        ),
                                    },
                                ],
                            ],
                        },
                    },
                ],
            },
            // Extract Sass files
            {
                test: /\.scss$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: 'css-loader' },
                    { loader: 'sass-loader' },
                ],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'image/svg+xml',
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

    // https://github.com/SheetJS/js-xlsx/issues/285

    externals: [{ './cptable': 'var cptable' }],

    resolve: {
        fallback: {
            fs: false,
        },
        /* assets/js/apps path allow using absolute import eg: from 'iaso/libs/Api' */
        modules: ['node_modules', path.resolve(__dirname, 'assets/js/apps/')],
        extensions: ['.js', '.tsx', '.ts'],
    },
};
