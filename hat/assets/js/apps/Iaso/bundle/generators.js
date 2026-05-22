const fs = require('fs');
const path = require('path');
const { getAvailableLanguages } = require('./languages.js');
const { getPluginFolders } = require('./plugins.js');

/**
 * Checks if file content is the same to avoid rewriting the same file.
 * The goal is to avoid having webpack generate a new bundle every time with the same content.
 * @param filePath
 * @param content
 */
function writeFileIfChanged(filePath, content) {
    if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, 'utf-8');
        if (existing === content) return;
    }
    fs.writeFileSync(filePath, content);
}

/** @param {string} rootDir */
/** @param {string[]} availableLanguages */
const generateCombinedTranslations = rootDir => {
    const availableLanguages = getAvailableLanguages(rootDir);
    const combinedTranslationsPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/bundle/generated/combinedTranslations.js',
    );

    // Create a combined translations object
    const combinedTranslations = {};

    availableLanguages.forEach(lang => {
        // Main translations
        const translationPath = path.resolve(
            rootDir,
            `./assets/js/apps/Iaso/domains/app/translations/${lang}.json`,
        );

        // Bluesquare-components translations
        const blsqPathForLang = path.resolve(
            rootDir,
            `../node_modules/bluesquare-components/dist/locale/${lang}.json`,
        );
        const pathExists = fs.existsSync(blsqPathForLang);
        if (!pathExists) {
            console.warn(
                `Warning: No translation file found for language ${lang} in bluesquare-components at ${blsqPathForLang}, will fall back to English`,
            );
        }
        const bluesquareTranslationsPath = pathExists
            ? blsqPathForLang
            : path.resolve(
                  rootDir,
                  `../node_modules/bluesquare-components/dist/locale/en.json`,
              );

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
    writeFileIfChanged(combinedTranslationsPath, fileContent);
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
    writeFileIfChanged(combinedConfigPath, fileContent);
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
    writeFileIfChanged(pluginKeysPath, fileContent);
    return pluginKeysPath;
};

/** @param {string} rootDir */
const generateLanguageConfigs = rootDir => {
    const availableLanguages = getAvailableLanguages(rootDir);
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
    const result = availableLanguages.reduce(
        (acc, lang) => {
            if (lang === 'en') return acc;

            const configPath = path.resolve(
                rootDir,
                `./assets/js/apps/Iaso/domains/app/translations/${lang}.config.js`,
            );

            if (fs.existsSync(configPath)) {
                const importName = `${lang}Config`;
                acc.imports.push(importName);
                acc.configs[lang] = importName;
            } else {
                console.warn(
                    `Warning: No config file found for language '${lang}', using English config as fallback`,
                );
                acc.configs[lang] = 'enConfig';
            }

            return acc;
        },
        { configs: {}, imports: [] },
    );

    // Update the original variables
    Object.assign(configs, result.configs);
    imports.push(...result.imports);

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all language configs into a single file.

${imports.map(imp => `import ${imp} from '../../domains/app/translations/${imp.replace('Config', '')}.config.js';`).join('\n')}

// Default config for languages without a specific config
const defaultConfig = {
    label: 'English',
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
    writeFileIfChanged(languageConfigsPath, fileContent);
    return languageConfigsPath;
};

module.exports = {
    generateCombinedTranslations,
    generateCombinedConfig,
    generatePluginKeysFile,
    generateLanguageConfigs,
};
