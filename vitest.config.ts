import path from 'path';

import { configDefaults, defineConfig } from 'vitest/config';
import 'dotenv/config';

// @ts-expect-error: workaround for TS2307 with @vitejs/plugin-react
import react from '@vitejs/plugin-react';

import {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
} from './hat/assets/js/apps/Iaso/bundle/generators.js';
import tsconfigPaths from 'vite-tsconfig-paths';

const LIB_PATH: string = path.join(__dirname, './hat');
const combinedTranslationsPath = generateCombinedTranslations(LIB_PATH);
const combinedConfigPath = generateCombinedConfig(LIB_PATH);
const pluginKeysPath = generatePluginKeysFile(LIB_PATH);
const languageConfigsPath = generateLanguageConfigs(LIB_PATH);

console.log('Available CPUs:', require('node:os').availableParallelism());
console.log('CPU count:', require('node:os').cpus().length);

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
        hookTimeout: 150_000,
        environment: 'jsdom',
        env: {
            // to avoid clashing with django debug
            DEBUG: process.env?.VITEST_DEBUG ?? '',
        },
        reporters: process.env?.GITHUB_ACTIONS === 'true' ? ['github-actions'] : ['default'],
        setupFiles: ['./hat/assets/js/tests/setup.ts', 'dotenv/config'],
        coverage: {
            enabled: !!process.env?.VITEST_COVERAGE,
            provider: 'v8',
            include: ['apps/**'],
            reporter: ['text', 'json', 'html'],
        },
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    include: [
                        'hat/assets/js/**/*.test.{ts,tsx}',
                        'plugins/*/js/**/*.test.{ts,tsx}',
                    ],
                    exclude: [
                        ...configDefaults.exclude,
                        '**/build/',
                        '**/dist/',
                        '**/*.min.js',
                        '**/playwright/**',
                        'hat/assets/js/__tests__/**',
                         '**/*.a11y.test.{ts,tsx}'
                    ],
                },
            },
            {
                extends: true,
                test: {
                    name: 'a11y',
                    include: [
                        'hat/assets/js/**/*.a11y.test.{ts,tsx}',
                        'plugins/*/js/**/*.a11y.test.{ts,tsx}',
                    ],
                    exclude: [
                        ...configDefaults.exclude, '**/build/', '**/dist/', '**/*.min.js', '**/playwright/**', 'hat/assets/js/__tests__/**',
                    ],
                },
            },
            {
                extends: true,
                test: {
                    name: 'integration',
                    include: [
                        'hat/assets/js/__tests__/integration/**/*.integration.test.{ts,tsx}',
                        'hat/assets/js/**/*.integration.test.{ts,tsx}',
                    ],
                    exclude: [
                        ...configDefaults.exclude, '**/build/', '**/dist/', '**/*.min.js', '**/playwright/**',
                    ],
                },
            },
            {
                extends: true,
                test: {
                    name: 'api-e2e',
                    include: [
                        'hat/assets/js/__tests__/api/*.test.{ts,tsx}',
                    ],
                    exclude: [
                        ...configDefaults.exclude, '**/build/', '**/dist/', '**/*.min.js', '**/playwright/**',
                    ],
                },
            },
        ],
    },
    resolve: {
        alias: {
            Iaso: path.resolve(LIB_PATH, 'assets', 'js', 'apps', 'Iaso'),
            'IasoModules/plugins/configs': combinedConfigPath,
            'IasoModules/plugins/keys': pluginKeysPath,
            'IasoModules/translations/configs': combinedTranslationsPath,
            'IasoModules/language/configs': languageConfigsPath,
        },
    },
    server: {
        watch: {
            ignored: [
                '**/.venv/**',
                '**/venv/**',
                '**/__pycache__/**',
                '**/site-packages/**',
            ],
        },
    },
});