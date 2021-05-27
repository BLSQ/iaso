const path = require('path');

module.exports = {
    webpack: function (config, env) {
        return config;
    },
    paths: function (paths, env) {
        paths.appBuild = path.join(__dirname, '../static/polio');
        return paths;
    },
};
