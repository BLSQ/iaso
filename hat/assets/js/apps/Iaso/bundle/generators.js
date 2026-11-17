const fs = require('fs');
const path = require('path');
const { getAvailableLanguages } = require('./languages.js');
const { getPluginFolders } = require('./plugins.js');

/**
 * Checks if file content is the same to avoid rewriting the same file.
 * The goal is to avoid having the bundler regenerate files when content is unchanged.
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

    // Create a combined translations object.
    // ESM imports (not require) so Vite can bundle the generated file.
    const combinedTranslations = {};
    const translationImports = [];
    let translationImportIndex = 0;
    const addTranslationImport = filePath => {
        const importName = `translationModule${translationImportIndex}`;
        translationImportIndex += 1;
        translationImports.push(
            `import ${importName} from ${JSON.stringify(filePath)};`,
        );
        return `...${importName}`;
    };

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

                    return addTranslationImport(
                        fs.existsSync(pluginTransPath)
                            ? pluginTransPath
                            : enPluginTransPath,
                    );
                }
                return '';
            })
            .filter(Boolean);

        const spreads = [
            addTranslationImport(translationPath),
            ...(fs.existsSync(bluesquareTranslationsPath)
                ? [addTranslationImport(bluesquareTranslationsPath)]
                : []),
            ...pluginTranslations,
        ];

        // Start building the combined translations for this language
        combinedTranslations[lang] = `{
            ${spreads.join(',\n            ')}
        }`;
    });

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all translations into a single file.

${translationImports.join('\n')}

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

    // import * as keeps `.default`, which usePlugins reads.
    const pluginImports = [];
    const combinedConfig = {};

    pluginFolders.forEach((plugin, index) => {
        const configPath = path.resolve(
            rootDir,
            `../plugins/${plugin}/js/config.tsx`,
        );
        const importName = `pluginConfig${index}`;
        pluginImports.push(
            `import * as ${importName} from ${JSON.stringify(configPath)};`,
        );
        combinedConfig[plugin] = importName;
    });

    // Create the file content
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// It combines all plugin configs into a single file.

${pluginImports.join('\n')}

const combinedConfigs = {
    ${Object.entries(combinedConfig)
        .map(([key, value]) => `    ${JSON.stringify(key)}: ${value}`)
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
