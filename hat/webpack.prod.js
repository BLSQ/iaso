const dotenv = require('dotenv');
const path = require('path');
const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
const LOCALE = 'fr';

dotenv.config();
// Application customizations
const primaryColor = process.env.THEME_PRIMARY_COLOR || '#3f51b5';
const secondaryColor = process.env.THEME_SECONDARY_COLOR || '#f50057';
const primaryBackgroundColor =
    process.env.THEME_PRIMARY_BACKGROUND_COLOR || '#F5F5F5';
const appTitle = process.env.APP_TITLE || 'Iaso';

module.exports = {
    // fail the entire build on 'module not found'
    bail: true,
    context: __dirname,
    mode: 'production',
    target: ['web', 'es2020'],
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
                REACT_THEME_PRIMARY_COLOR: `"${primaryColor}"`,
                REACT_THEME_SECONDARY_COLOR: `"${secondaryColor}"`,
                REACT_THEME_PRIMARY_BACKGROUND_COLOR: `"${primaryBackgroundColor}"`,
                REACT_APP_TITLE: `"${appTitle}"`,
                // This has effect on the react lib size
                // need to do JSON stringify on all vars here to take effect,
                // see https://github.com/eHealthAfrica/guinea-connect-universal-app/blob/development/webpack/prod.config.js
                NODE_ENV: JSON.stringify('production'),
            },
            __LOCALE: JSON.stringify(LOCALE),
        }),
        // Minification
        new webpack.LoaderOptionsPlugin({ minimize: true }),
        // XLSX
        new webpack.IgnorePlugin(/cptable/),
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
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                            ],
                            plugins: [
                                ['@babel/transform-runtime'],
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
                                    { targets: { node: '14' } },
                                ],
                                [
                                    '@babel/preset-typescript',
                                    { isTSX: true, allExtensions: true },
                                ],
                                '@babel/preset-react',
                            ],
                            plugins: [
                                ['@babel/transform-runtime'],
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
                    { loader: 'css-loader' },
                    {
                        loader: 'sass-loader',
                        options: {
                            additionalData:
                                `$primary: ${primaryColor};` +
                                `$primary-background: ${primaryBackgroundColor};` +
                                `$secondary: ${secondaryColor};`,
                        },
                    },
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
