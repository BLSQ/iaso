/* eslint-disable no-param-reassign */
/// <reference types="cypress" />
import * as dotenv from 'dotenv';

const webpackPreprocessor = require('@cypress/webpack-preprocessor');
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
dotenv.config();

const webpackOptions = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};

module.exports = (on, config) => {
    on('file:preprocessor', webpackPreprocessor({ webpackOptions }));
    // `on` is used to hook into various events Cypress emits
    // `config` is the resolved Cypress config
    config.env.siteBaseUrl = process.env.CYPRESS_BASE_URL;

    config.env.username = process.env.CYPRESS_USERNAME;
    config.env.password = process.env.CYPRESS_PASSWORD;

    config.env.sessionCookie = 'sessionid';
    config.env.langageCookie = 'django_language';

    config.env.plugins = process.env.PLUGINS;

    return config;
};
