const fs = require('fs');
const path = require('path');

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const getPluginFolders = rootDir => {
    const pluginsPath = path.resolve(rootDir, '../plugins');
    return fs.readdirSync(pluginsPath).filter(pluginName => {
        const fullPath = path.join(pluginsPath, pluginName);
        // Only return directories and skip special directories
        return (
            fs.statSync(fullPath).isDirectory() &&
            !pluginName.startsWith('.') &&
            !pluginName.startsWith('__') &&
            // Check if the directory contains a js/config.tsx file
            fs.existsSync(path.join(fullPath, 'js', 'config.tsx'))
        );
    });
};

module.exports = {
    getPluginFolders,
};
