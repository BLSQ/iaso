const fs = require('fs');
const path = require('path');
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
                `Warning: No translation file found for language ${lang} in main app at ${translationPath}, will fall back to English`,
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
                `Warning: No translation file found for language ${lang} in bluesquare-components at ${bluesquareTranslationsPath}, will fall back to English`,
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
                    // Check for translations at build time using standard path
                    const pluginTransPath = path.resolve(
                        rootDir,
                        `../plugins/${plugin}/js/src/constants/translations/${lang}.json`,
                    );
                    const enPluginTransPath = path.resolve(
                        rootDir,
                        `../plugins/${plugin}/js/src/constants/translations/en.json`,
                    );

                    if (!fs.existsSync(pluginTransPath) && lang !== 'en') {
                        console.warn(
                            `Warning: No translation file found for language ${lang} in plugin ${plugin} at ${pluginTransPath}, will fall back to English`,
                        );
                    }

                    // Generate code that directly requires the translation file
                    return `...require('${fs.existsSync(pluginTransPath) ? pluginTransPath : enPluginTransPath}'),`;
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
/** @param {string[]} availableLanguages */
const generateLanguageConfigs = (rootDir, availableLanguages) => {
    const languageConfigsPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/languageConfigs.js',
    );

    // Build imports and configs map
    const imports = ['enConfig'];
    const configs = {
        en: 'enConfig',
    };

    // Check each language config file
    availableLanguages.forEach(lang => {
        if (lang === 'en') return;

        const configPath = path.resolve(
            rootDir,
            `./assets/js/apps/Iaso/domains/app/translations/${lang}.config.js`,
        );

        if (fs.existsSync(configPath)) {
            const importName = `${lang}Config`;
            imports.push(importName);
            configs[lang] = importName;
        } else {
            console.warn(
                `Warning: No config file found for language '${lang}', using English config as fallback`,
            );
            configs[lang] = 'enConfig';
        }
    });

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all language configs into a single file.

${imports.map(imp => `import ${imp} from '../../domains/app/translations/${imp.replace('Config', '')}.config.js';`).join('\n')}

// Default config for languages without a specific config
const defaultConfig = {
    label: 'English version',
    dateFormats: {
        LT: 'h:mm A',
        LTS: 'DD/MM/YYYY HH:mm',
        L: 'DD/MM/YYYY',
        LL: 'Do MMMM YYYY',
        LLL: 'Do MMMM YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
    },
    thousandGroupStyle: 'thousand',
};

// Combine all language configs
export const LANGUAGE_CONFIGS = {
    ${Object.entries(configs)
        .map(([lang, config]) => {
            // Ensure each config has the required date formats
            return `${lang}: {
                ...defaultConfig,
                ...${config},
                dateFormats: {
                    ...defaultConfig.dateFormats,
                    ...(${config}.dateFormats || {}),
                },
            }`;
        })
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
