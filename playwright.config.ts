import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from './hat/assets/js/__tests__/playwright/setup/setup.helpers';
import dotenv from 'dotenv';
import path from 'path';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

dotenv.config({ path: path.resolve(__dirname, '.env') });
const targetTestDir =
    process.env?.TARGET_TEST_DIR ?? './hat/assets/js/__tests__/playwright';
export default defineConfig({
    testDir: targetTestDir,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. */
        baseURL: process.env?.TARGET_SERVER_URL ?? 'http://localhost:8000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects */
    projects: [
        {
            name: 'smoke',
            testDir: `${targetTestDir}/smoke`,
            testMatch: '**/*.test.ts',
            use: (() => {
                loadEnv('smoke', ['GIT_TAG']);
                return {
                    ...devices['Desktop Chrome'],
                    screenshot: 'only-on-failure',
                };
            })(),
        },
        {
            name: 'e2e',
            testDir: `${targetTestDir}/e2e`,
            testMatch: '**/*.test.ts',
            use: {
                ...devices['Desktop Chrome'],
                screenshot: 'only-on-failure',
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
