require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
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

const oldBrowsersConfig = [
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
                        '@babel/preset-react',
                        [
                            '@babel/preset-typescript',
                            { isTSX: true, allExtensions: true },
                        ],
                    ],
                    plugins: ['@babel/transform-runtime', 'formatjs'],
                },
            },
        ],
    },
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
                    plugins: ['@babel/transform-runtime', 'formatjs'],
                },
            },
        ],
    },
];
const newBrowsersConfig = [
    {
        test: /\.(ts|tsx)?$/,
        exclude: /node_modules/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    // cacheDirectory: true,
                    presets: [
                        ['@babel/preset-env', { targets: { node: '14' } }],
                        '@babel/preset-react',
                        [
                            '@babel/preset-typescript',
                            { isTSX: true, allExtensions: true },
                        ],
                    ],
                    plugins: ['@babel/transform-runtime', 'formatjs'],
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
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                    plugins: ['@babel/transform-runtime', 'formatjs'],
                },
            },
        ],
    },
];

// Function to get plugin folders
const getPluginFolders = () => {
    const pluginsPath = path.resolve(__dirname, '../plugins');
    return fs.readdirSync(pluginsPath).filter(file => {
        const fullPath = path.join(pluginsPath, file);
        // Only return directories and skip special directories
        return (
            fs.statSync(fullPath).isDirectory() &&
            !file.startsWith('.') &&
            !file.startsWith('__') &&
            // Check if the directory contains a js/config.tsx file
            fs.existsSync(path.join(fullPath, 'js', 'config.tsx'))
        );
    });
};

// Function to generate a combined config file
const generateCombinedConfig = () => {
    const pluginFolders = getPluginFolders();
    const combinedConfigPath = path.resolve(
        __dirname,
        './assets/js/combinedPluginConfigs.js',
    );

    // Create a combined config object
    const combinedConfig = {};

    pluginFolders.forEach(plugin => {
        const configPath = path.resolve(
            __dirname,
            `../plugins/${plugin}/js/config.tsx`,
        );
        // Use require to get the config
        try {
            // We need to use a dynamic require to avoid webpack bundling issues
            // This will be replaced at runtime
            combinedConfig[plugin] = `require('${configPath}')`;
        } catch (error) {
            console.error(`Error loading config for plugin ${plugin}:`, error);
        }
    });

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all plugin configs into a single file.

const combinedConfigs = {
    ${Object.entries(combinedConfig)
        .map(([key, value]) => `    ${key}: ${value}`)
        .join(',\n')}
};

export default combinedConfigs;
`;

    // Write the file
    fs.writeFileSync(combinedConfigPath, fileContent);
    return combinedConfigPath;
};

// Function to generate a plugin keys file
const generatePluginKeysFile = () => {
    const pluginFolders = getPluginFolders();
    const pluginKeysPath = path.resolve(__dirname, './assets/js/pluginKeys.js');

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It contains the list of available plugin keys.

const pluginKeys = ${JSON.stringify(pluginFolders, null, 2)};

export default pluginKeys;
`;

    // Write the file
    fs.writeFileSync(pluginKeysPath, fileContent);
    return pluginKeysPath;
};

const pluginFolders = getPluginFolders();
console.log('Found plugins:', pluginFolders);

// Generate the combined config file
const combinedConfigPath = generateCombinedConfig();

// Generate the plugin keys file
const pluginKeysPath = generatePluginKeysFile();

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
            filename: `${WEBPACK_PATH}/webpack-stats.json`,
        }),
        new webpack.DefinePlugin({
            __LOCALE: JSON.stringify(LOCALE),
        }),
        // XLSX
        new webpack.IgnorePlugin({ resourceRegExp: /cptable/ }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^perf_hooks$/,
        }),
        new ModuleFederationPlugin({
            name: 'iaso_plugins',
            filename: 'remoteEntry.js',
            library: { type: 'self', name: 'iaso_plugins' },
            exposes: {
                './configs': combinedConfigPath,
                './keys': pluginKeysPath,
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
            'iaso_plugins/configs': combinedConfigPath,
            'iaso_plugins/keys': pluginKeysPath,
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
