require('dotenv').config();
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');

const {
    oldBrowsersConfig,
    newBrowsersConfig,
} = require('./assets/js/apps/Iaso/bundle/browserConfigs.js');

const {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
} = require('./assets/js/apps/Iaso/bundle/generators.js');

// Switch here for French. This is set to 'en' in dev to not get react-intl warnings
// remember to switch in webpack.prod.js and
// django settings as well
const LOCALE = 'fr';
// If you launch the dev server with `WEBPACK_HOST=192.168.1.XXX  npm run dev`
// where 192.168.1.XXX is your local IP address, you can access the dev server
// from another device on the same network, typically from a mobile device or tablet
const WEBPACK_HOST = process.env.WEBPACK_HOST || 'localhost';
const WEBPACK_PORT = process.env.WEBPACK_PORT || '3000';
const WEBPACK_PROTOCOL = process.env.WEBPACK_PROTOCOL || 'http';
const WEBPACK_URL = `${WEBPACK_PROTOCOL}://${WEBPACK_HOST}:${WEBPACK_PORT}`;
const WEBPACK_PATH =
    process.env.WEBPACK_PATH || path.resolve(__dirname, './assets/webpack/');

// Parse available languages from environment variable or default to "en,fr"
const availableLanguages = (process.env.AVAILABLE_LANGUAGES || 'en,fr').split(
    ',',
);

// Generate the combined translations file
const combinedTranslationsPath = generateCombinedTranslations(
    __dirname,
    availableLanguages,
);

// Generate the combined config file
const combinedConfigPath = generateCombinedConfig(__dirname);

// Generate the plugin keys file
const pluginKeysPath = generatePluginKeysFile(__dirname);

// Generate the language configs file
const languageConfigsPath = generateLanguageConfigs(__dirname);

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
            '@mui/material',
            // Don't include, it packs all the icon instead of actually used one
            // '@mui/icons-material',
            '@mui/lab',
            '@mui/x-date-pickers',
            'lodash',
            'moment',
            'leaflet',
            'leaflet-draw',
            'prop-types',
            'typescript',
            'video.js',
        ],
        // styles: ['./assets/css/index.scss'],
        iaso: {
            dependOn: 'common',
            import: './assets/js/apps/Iaso/index',
        },
        superset: {
            import: './assets/js/supersetSDK',
        },
    },

    output: {
        path: WEBPACK_PATH,
        filename: '[name].js',
        sourceMapFilename: '[name].[contenthash].js.map',
        publicPath: `${WEBPACK_URL}/`,
        assetModuleFilename: 'assets/[name].[hash][ext][query]',
        scriptType: 'text/javascript',
    },
    devtool: 'source-map',

    // config for webpack-dev-server
    devServer: {
        historyApiFallback: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        host: '0.0.0.0',
        port: 3000,
        hot: true,
        devMiddleware: {
            writeToDisk: true,
        },
        static: {
            directory: path.join(__dirname, 'assets'),
            publicPath: '/',
        },
        client: {
            overlay: true,
            progress: true,
        },
        watchFiles: {
            paths: ['src/**/*', 'assets/**/*', '../plugins/**/*'],
            options: {
                usePolling: true,
            },
        },
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new CleanWebpackPlugin(),
        new webpack.NoEmitOnErrorsPlugin(), // don't reload if there is an error
        new BundleTracker({
            filename: `${WEBPACK_PATH}/webpack-stats.json`,
        }),
        new webpack.DefinePlugin({
            __LOCALE: JSON.stringify(LOCALE),
            AVAILABLE_LANGUAGES: JSON.stringify(availableLanguages),
        }),
        // XLSX
        new webpack.IgnorePlugin({ resourceRegExp: /cptable/ }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^perf_hooks$/,
        }),
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

    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: /node_modules/,
            },
            ...(process.env.OLD_BROWSER === 'true'
                ? oldBrowsersConfig
                : newBrowsersConfig),
            {
                test: /\.css$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
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
    externals: [{ './cptable': 'var cptable' }],

    resolve: {
        alias: {
            'react/jsx-runtime': 'react/jsx-runtime.js',
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
        modules: [
            'node_modules',
            path.resolve(__dirname, '../plugins'),
            path.resolve(__dirname, 'assets/js/apps/'),
            ...(process.env.LIVE_COMPONENTS === 'true'
                ? ['../../bluesquare-components/node_modules/']
                : []),
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    stats: {
        errorDetails: true,
    },
    ignoreWarnings: [
        {
            module: /typescript/,
            message: /the request of a dependency is an expression/,
        },
    ],
};
