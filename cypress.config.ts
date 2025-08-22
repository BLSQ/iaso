import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: 'Iaso',
    fixturesFolder: 'hat/assets/js/cypress/fixtures',
    screenshotsFolder: 'hat/assets/js/cypress/screenshots',
    videosFolder: 'hat/assets/js/cypress/videos',
    downloadsFolder: 'hat/assets/js/cypress/downloads',
    viewportWidth: 1920,
    viewportHeight: 1024,
    // Add better default timeouts for CI environment
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    e2e: {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            return require('./hat/assets/js/cypress/plugins/index.js')(
                on,
                config,
            );
        },
        specPattern: [
            './/hat/assets/js/cypress/integration/**/*.js',
            './/plugins/**/cypress/integration/**/*.js',
        ],
        supportFile: 'hat/assets/js/cypress/support/index.js',
        experimentalRunAllSpecs: true,
        // Add retry configuration for flaky tests
        retries: {
            runMode: 2,
            openMode: 0,
        },
    },
});
