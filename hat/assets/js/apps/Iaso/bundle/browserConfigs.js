const path = require('path');
// We can't import types in CommonJS, but we can use them via JSDoc comments
/** @type {import('webpack').RuleSetRule[]} */
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
            path.resolve(
                __dirname,
                '../../../../../node_modules/react-leaflet',
            ),
            path.resolve(
                __dirname,
                '../../../../../node_modules/@react-leaflet',
            ),
            path.resolve(__dirname, '../../../../../node_modules/@dnd-kit'),
            path.resolve(__dirname, '../../../../../plugins'),
            path.resolve(__dirname, '../../../../../assets'),
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

/** @type {import('webpack').RuleSetRule[]} */
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

module.exports = {
    oldBrowsersConfig,
    newBrowsersConfig,
};
