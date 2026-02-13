import path from 'path';

import { configDefaults, defineConfig } from 'vitest/config';

// @ts-expect-error: workaround for TS2307 with @vitejs/plugin-react
import react from '@vitejs/plugin-react';

import {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
} from './hat/assets/js/apps/Iaso/bundle/generators.js';
import tsconfigPaths from 'vite-tsconfig-paths';

const LIB_PATH: string = path.join(__dirname, './hat')
const combinedTranslationsPath = generateCombinedTranslations(LIB_PATH);
const combinedConfigPath = generateCombinedConfig(LIB_PATH);
const pluginKeysPath = generatePluginKeysFile(LIB_PATH);
const languageConfigsPath = generateLanguageConfigs(LIB_PATH);


export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths()
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['./hat/assets/js/**/*.test.{ts,tsx}'],
        setupFiles: ['./hat/assets/js/tests/setup.ts'],
        exclude: [...configDefaults.exclude, '**/build/', '**/dist/', '**/*.min.js'],
        coverage: {
            provider: 'v8',
            include: ['./hat/assets/js/apps/**'],
            reporter: ['text', 'json', 'html'],
        },
    },
    resolve: {
        alias: {
            'IasoModules/plugins/configs': combinedConfigPath,
            'IasoModules/plugins/keys': pluginKeysPath,
            'IasoModules/translations/configs': combinedTranslationsPath,
            'IasoModules/language/configs': languageConfigsPath,
        },
    },
});