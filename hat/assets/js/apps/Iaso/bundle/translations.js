/**
 * This file contains functions for handling translations in Iaso
 */

const fs = require('fs');
const path = require('path');

/**
 * Scans for translation files in the specified directories and filters by available languages
 * @param {string} rootDir - The root directory to start scanning from
 * @param {string[]} availableLanguages - List of language codes to include
 * @returns {Object} - Object containing translations for each available language
 */
function scanTranslations(rootDir, availableLanguages) {
    // Get all translation files from the main app
    const mainTranslationsPath = path.join(
        rootDir,
        'assets/js/apps/Iaso/translations',
    );
    const pluginTranslationsPath = path.join(rootDir, 'plugins');
    const componentTranslationsPath = path.join(
        rootDir,
        '..',
        'bluesquare-components',
        'src',
        'translations',
    );

    // Initialize result object
    const translations = {};
    const missingLanguages = [];

    // Process each available language
    availableLanguages.forEach(lang => {
        translations[lang] = {};

        // Check main app translations
        const mainLangPath = path.join(mainTranslationsPath, `${lang}.json`);
        if (fs.existsSync(mainLangPath)) {
            try {
                translations[lang].main = JSON.parse(
                    fs.readFileSync(mainLangPath, 'utf8'),
                );
            } catch (error) {
                console.warn(
                    `Warning: Error parsing main translations for ${lang}: ${error.message}`,
                );
            }
        }

        // Check plugin translations
        translations[lang].plugins = {};
        if (fs.existsSync(pluginTranslationsPath)) {
            const pluginFolders = fs
                .readdirSync(pluginTranslationsPath)
                .filter(file =>
                    fs
                        .statSync(path.join(pluginTranslationsPath, file))
                        .isDirectory(),
                );

            pluginFolders.forEach(pluginFolder => {
                const pluginLangDir = path.join(
                    pluginTranslationsPath,
                    pluginFolder,
                    'translations',
                );
                if (fs.existsSync(pluginLangDir)) {
                    const pluginLangPath = path.join(
                        pluginLangDir,
                        `${lang}.json`,
                    );
                    if (fs.existsSync(pluginLangPath)) {
                        try {
                            translations[lang].plugins[pluginFolder] =
                                JSON.parse(
                                    fs.readFileSync(pluginLangPath, 'utf8'),
                                );
                        } catch (error) {
                            console.warn(
                                `Warning: Error parsing translations for plugin ${pluginFolder} (${lang}): ${error.message}`,
                            );
                        }
                    }
                }
            });
        }

        // Check component translations
        translations[lang].components = {};
        if (fs.existsSync(componentTranslationsPath)) {
            const componentLangPath = path.join(
                componentTranslationsPath,
                `${lang}.json`,
            );
            if (fs.existsSync(componentLangPath)) {
                try {
                    translations[lang].components = JSON.parse(
                        fs.readFileSync(componentLangPath, 'utf8'),
                    );
                } catch (error) {
                    console.warn(
                        `Warning: Error parsing component translations for ${lang}: ${error.message}`,
                    );
                }
            }
        }

        // Check if any translations were found for this language
        if (
            Object.keys(translations[lang].main || {}).length === 0 &&
            Object.keys(translations[lang].plugins || {}).length === 0 &&
            Object.keys(translations[lang].components || {}).length === 0
        ) {
            missingLanguages.push(lang);
        }
    });

    // Show warning for missing languages
    if (missingLanguages.length > 0) {
        console.warn(
            `Warning: No translation files found for languages: ${missingLanguages.join(', ')}`,
        );
    }

    return translations;
}

module.exports = {
    scanTranslations,
};
