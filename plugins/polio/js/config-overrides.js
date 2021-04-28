const path = require("path");

module.exports = {
  webpack: function (config, env) {
    config.output.publicPath = "/static/polio/";

    return config;
  },
  paths: function (paths, env) {
    paths.appBuild = path.join(__dirname, "../static/polio");
    return paths;
  },
};
