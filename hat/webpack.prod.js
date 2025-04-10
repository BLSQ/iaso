const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const BundleTracker = require('webpack-bundle-tracker');

const {
    generateCombinedTranslations,
    generateLanguageKeysFile,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
} = require('./assets/js/apps/Iaso/bundle/generators.js');

// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
const LOCALE = 'fr';

// Parse available languages from environment variable or default to "en,fr"
const availableLanguages = (process.env.AVAILABLE_LANGUAGES || 'en,fr').split(
    ',',
);

// Generate the combined config file
const combinedConfigPath = generateCombinedConfig(__dirname);

// Generate the plugin keys file
const pluginKeysPath = generatePluginKeysFile(__dirname);

// Generate the combined translations file
const combinedTranslationsPath = generateCombinedTranslations(
    __dirname,
    availableLanguages,
);

// Generate the language keys file
const languageKeysPath = generateLanguageKeysFile(__dirname);

// Generate the language configs file
const languageConfigsPath = generateLanguageConfigs(__dirname);

module.exports = {
    // fail the entire build on 'module not found'
    bail: true,
    context: __dirname,
    mode: 'production',
    target: ['web', 'es2015'],
    entry: {
        common: ['react', 'react-dom', 'react-intl', 'typescript'],
        iaso: './assets/js/apps/Iaso/index',
        superset: './assets/js/supersetSDK',
    },

    stats: {
        children: true,
    },
    output: {
        path: path.resolve(__dirname, './assets/webpack'),
        filename: '[name]-[chunkhash].js',
        publicPath: '',
        assetModuleFilename: 'assets/[name].[hash][ext][query]',
    },
    devtool: 'source-map',

    plugins: [
        new BundleTracker({
            filename: path.resolve(
                __dirname,
                './assets/webpack/webpack-stats-prod.json',
            ),
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
            AVAILABLE_LANGUAGES: JSON.stringify(availableLanguages),
        }),
        // Minification
        new webpack.LoaderOptionsPlugin({ minimize: true }),
        new webpack.WatchIgnorePlugin({
            paths: [/\.d\.ts$/],
        }),
        // Module Federation for plugins
        new ModuleFederationPlugin({
            name: 'IasoModules',
            filename: 'remoteEntry.js',
            library: { type: 'self', name: 'IasoModules' },
            exposes: {
                './plugins/configs': combinedConfigPath,
                './plugins/keys': pluginKeysPath,
                './translations/configs': combinedTranslationsPath,
                './translations/keys': languageKeysPath,
                './language/configs': languageConfigsPath,
            },
            shared: {
                react: {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
                'react-dom': {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
                'react-intl': {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
                '@mui/material': {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
                'bluesquare-components': {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
            },
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
                                            '@babel/plugin-transform-optional-chaining',
                                            '@babel/plugin-transform-nullish-coalescing-operator',
                                            '@babel/plugin-transform-numeric-separator',
                                            '@babel/plugin-transform-logical-assignment-operators',
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
                                            '@babel/plugin-transform-optional-chaining',
                                            '@babel/plugin-transform-nullish-coalescing-operator',
                                            '@babel/plugin-transform-numeric-separator',
                                            '@babel/plugin-transform-logical-assignment-operators',
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
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]',
                },
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]',
                },
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]',
                },
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]',
                },
            },
            {
                test: /\.mp4$/,
                type: 'asset/resource',
                generator: {
                    filename: 'videos/[name].[hash][ext]',
                },
            },
            {
                test: /\.mjs$/,
                type: 'javascript/auto',
                use: 'babel-loader',
            },
        ],
        noParse: [require.resolve('typescript/lib/typescript.js')], // remove warning: https://github.com/microsoft/TypeScript/issues/39436
    },

    // https://github.com/SheetJS/js-xlsx/issues/285

    externals: [{ './cptable': 'var cptable' }],

    resolve: {
        alias: {
            'react/jsx-runtime': 'react/jsx-runtime.js',
            // Add alias for the combined config
            'IasoModules/plugins/configs': combinedConfigPath,
            'IasoModules/plugins/keys': pluginKeysPath,
            'IasoModules/translations/configs': combinedTranslationsPath,
            'IasoModules/translations/keys': languageKeysPath,
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
        /* assets/js/apps path allow using absolute import eg: from 'iaso/libs/Api' */
        modules: ['node_modules', path.resolve(__dirname, 'assets/js/apps/')],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
};
