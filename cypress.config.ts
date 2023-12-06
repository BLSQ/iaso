import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: 'Iaso',
    fixturesFolder: 'hat/assets/js/cypress/fixtures',
    screenshotsFolder: 'hat/assets/js/cypress/screenshots',
    videosFolder: 'hat/assets/js/cypress/videos',
    downloadsFolder: 'hat/assets/js/cypress/downloads',
    viewportWidth: 1920,
    viewportHeight: 1024,
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
            './/hat/assets/js/cypress/integration/04 - tasks/**/*.js',
            './/plugins/**/cypress/integration/**/*.js',
        ],
        supportFile: 'hat/assets/js/cypress/support/index.js',
        experimentalRunAllSpecs: true,
    },
});
