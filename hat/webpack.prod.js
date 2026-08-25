const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const BundleTracker = require('webpack-bundle-tracker');

const {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
} = require('./assets/js/apps/Iaso/bundle/generators.js');

// Switch here for french
// remember to switch in webpack.dev.js and
// django settings as well
const LOCALE = 'fr';

// Generate the combined config file
const combinedConfigPath = generateCombinedConfig(__dirname);

// Generate the plugin keys file
const pluginKeysPath = generatePluginKeysFile(__dirname);

// Generate the combined translations file
const combinedTranslationsPath = generateCombinedTranslations(__dirname);

// Generate the language configs file
const languageConfigsPath = generateLanguageConfigs(__dirname);

// Samsung Tizen / native TV browser is roughly Chrome 55. Keep these
// targets even though package.json browserslist is newer.
const babelEnvOptions = {
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
};

const babelPlugins = [
    '@babel/transform-runtime',
    [
        'formatjs',
        {
            messagesDir: path.join(__dirname, '/assets/messages'),
        },
    ],
];

module.exports = {
    // fail the entire build on 'module not found'
    bail: true,
    context: __dirname,
    mode: 'production',
    target: ['web', 'es2015'],
    entry: {
        // Do not put `typescript` here: it ships the compiler (~2MB minified)
        // to every browser. Babel already compiles .ts/.tsx.
        common: ['react', 'react-dom', 'react-intl'],
        iaso: {
            dependOn: 'common',
            import: './assets/js/apps/Iaso/index',
        },
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
                ORVAL_API_BASE_URL: JSON.stringify(process.env?.ORVAL_API_BASE_URL ?? "")
            },
            __LOCALE: JSON.stringify(LOCALE),
        }),
        new webpack.IgnorePlugin({ resourceRegExp: /cptable/ }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^perf_hooks$/,
        }),
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
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: { passes: 2 },
                },
            }),
        ],
        // Default webpack 5 async splitting. Initial React sharing is
        // handled by entry.dependOn — do not split initial chunks or the
        // HTML load order (common then iaso) breaks.
        splitChunks: {
            chunks: 'async',
        },
        concatenateModules: true,
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
                                ['@babel/preset-env', babelEnvOptions],
                                '@babel/preset-react',
                            ],
                            plugins: babelPlugins,
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
                                ['@babel/preset-env', babelEnvOptions],
                                [
                                    '@babel/preset-typescript',
                                    { isTSX: true, allExtensions: true },
                                ],
                                '@babel/preset-react',
                            ],
                            plugins: babelPlugins,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|ttf|eot|otf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]',
                    publicPath: '/static/',
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
            'react/jsx-runtime.js': 'react/jsx-runtime',
            // Add alias for the combined config
            'IasoModules/plugins/configs': combinedConfigPath,
            'IasoModules/plugins/keys': pluginKeysPath,
            'IasoModules/translations/configs': combinedTranslationsPath,
            'IasoModules/language/configs': languageConfigsPath,
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
