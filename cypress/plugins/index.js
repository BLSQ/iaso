/* eslint-disable no-param-reassign */
/// <reference types="cypress" />
import * as dotenv from 'dotenv';
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
module.exports = (on, config) => {
    // `on` is used to hook into various events Cypress emits
    // `config` is the resolved Cypress config
    config.env.username = process.env.USERNAME;
    config.env.password = process.env.PASSWORD;

    return config;
};
