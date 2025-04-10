const fs = require('fs');
const path = require('path');

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const getPluginFolders = rootDir => {
    const pluginsPath = path.resolve(rootDir, '../plugins');
    return fs.readdirSync(pluginsPath).filter(file => {
        const fullPath = path.join(pluginsPath, file);
        // Only return directories and skip special directories
        return (
            fs.statSync(fullPath).isDirectory() &&
            !file.startsWith('.') &&
            !file.startsWith('__') &&
            // Check if the directory contains a js/config.tsx file
            fs.existsSync(path.join(fullPath, 'js', 'config.tsx'))
        );
    });
};

module.exports = {
    getPluginFolders,
};
