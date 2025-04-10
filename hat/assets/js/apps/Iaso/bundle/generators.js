const fs = require('fs');
const path = require('path');
const { getAvailableLanguages } = require('./languages.js');
const { getPluginFolders } = require('./plugins.js');

/** @param {string} rootDir */
/** @param {string[]} availableLanguages */

const generateCombinedTranslations = (rootDir, availableLanguages) => {
    const combinedTranslationsPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/combinedTranslations.js',
    );

    // Create a combined translations object
    const combinedTranslations = {};

    availableLanguages.forEach(lang => {
        // Main translations
        let translationPath = path.resolve(
            rootDir,
            `./assets/js/apps/Iaso/domains/app/translations/${lang}.json`,
        );
        if (!fs.existsSync(translationPath)) {
            console.warn(
                `Translation file not found for language ${lang} at ${translationPath}, using en.json instead`,
            );
            translationPath = path.resolve(
                rootDir,
                `./assets/js/apps/Iaso/domains/app/translations/en.json`,
            );
        }

        // Bluesquare-components translations
        let bluesquareTranslationsPath = path.resolve(
            rootDir,
            `../node_modules/bluesquare-components/dist/locale/${lang}.json`,
        );
        if (!fs.existsSync(bluesquareTranslationsPath)) {
            console.warn(
                `Translation file not found for language ${lang} at ${bluesquareTranslationsPath}, using en.json instead`,
            );
            bluesquareTranslationsPath = path.resolve(
                rootDir,
                `../node_modules/bluesquare-components/dist/locale/en.json`,
            );
        }

        // Plugin translations
        const plugins = getPluginFolders(rootDir);

        const pluginTranslations = plugins
            .map(plugin => {
                const configPath = path.resolve(
                    rootDir,
                    `../plugins/${plugin}/js/config.tsx`,
                );

                if (fs.existsSync(configPath)) {
                    return `...(() => {
                        const config = require('${configPath}');
                        const translations = (config.default || config).translations.${lang};
                        return translations;
                    })(),`;
                }
                return '';
            })
            .filter(Boolean);

        // Start building the combined translations for this language
        combinedTranslations[lang] = `{
            ...require('${translationPath}'),
            ${fs.existsSync(bluesquareTranslationsPath) ? `...require('${bluesquareTranslationsPath}'),` : ''}
            ${pluginTranslations.join('\n            ')}
        }`;
    });

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all translations into a single file.

export const translations = {
    ${Object.entries(combinedTranslations)
        .map(([key, value]) => `    ${key}: ${value}`)
        .join(',\n')}
};

export default translations;
`;

    // Create the generated directory if it doesn't exist
    const generatedDir = path.dirname(combinedTranslationsPath);
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(combinedTranslationsPath, fileContent);
    return combinedTranslationsPath;
};

/** @param {string} rootDir */
const generateCombinedConfig = rootDir => {
    const pluginFolders = getPluginFolders(rootDir);
    const combinedConfigPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/combinedPluginConfigs.js',
    );

    // Create a combined config object
    const combinedConfig = {};

    pluginFolders.forEach(plugin => {
        const configPath = path.resolve(
            rootDir,
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

    // Create the generated directory if it doesn't exist
    const generatedDir = path.dirname(combinedConfigPath);
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(combinedConfigPath, fileContent);
    return combinedConfigPath;
};

/** @param {string} rootDir */
const generatePluginKeysFile = rootDir => {
    const pluginFolders = getPluginFolders(rootDir);
    const pluginKeysPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/pluginKeys.js',
    );

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It contains the list of available plugin keys.

const pluginKeys = ${JSON.stringify(pluginFolders, null, 2)};

export default pluginKeys;
`;

    // Create the generated directory if it doesn't exist
    const generatedDir = path.dirname(pluginKeysPath);
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(pluginKeysPath, fileContent);
    return pluginKeysPath;
};

/** @param {string} rootDir */
const generateLanguageConfigs = rootDir => {
    const languages = getAvailableLanguages(rootDir);
    const languageConfigsPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/languageConfigs.js',
    );

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all language configs into a single file.

import enConfig from '../../domains/app/translations/en.config.js';
import frConfig from '../../domains/app/translations/fr.config.js';

// Default config for languages without a specific config
const defaultConfig = {
    label: 'English version',
    dateFormats: enConfig.dateFormats,
    thousandGroupStyle: 'thousand',
};

// Combine all language configs
export const LANGUAGE_CONFIGS = {
    en: enConfig,
    fr: frConfig,
    ${languages
        .filter(lang => lang !== 'en' && lang !== 'fr')
        .map(lang => `${lang}: defaultConfig`)
        .join(',\n    ')}
};

export default LANGUAGE_CONFIGS;
`;

    // Create the generated directory if it doesn't exist
    const generatedDir = path.dirname(languageConfigsPath);
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(languageConfigsPath, fileContent);
    return languageConfigsPath;
};

module.exports = {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
};
