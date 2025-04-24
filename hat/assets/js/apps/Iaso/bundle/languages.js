const fs = require('fs');
const path = require('path');

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const getAvailableLanguages = rootDir => {
    const translationsPath = path.resolve(
        rootDir,
        './assets/js/apps/Iaso/domains/app/translations',
    );
    if (!fs.existsSync(translationsPath)) {
        console.warn(
            'Translations directory not found, using default languages',
            translationsPath,
        );
        return ['en', 'fr'];
    }

    return fs
        .readdirSync(translationsPath)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
};

module.exports = {
    getAvailableLanguages,
};
