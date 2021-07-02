var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.dev');

new WebpackDevServer(webpack(config), {
    publicPath: config.output.publicPath,
    hot: false,
    inline: false,
    historyApiFallback: true,
    https: false,
    // It suppress error shown in console, so it has to be set to false.
    quiet: false,
    // It suppress everything except error, so it has to be set to false as well
    // to see success build.
    noInfo: false,
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    stats: {
        // Config for minimal console.log mess.
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false,
    },
}).listen(3000, '0.0.0.0', function (err, result) {
    if (err) {
        console.log(err);
    }

    console.log('Listening at 0.0.0.0:3000');
});
