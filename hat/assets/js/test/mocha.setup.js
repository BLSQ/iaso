const jsdom = require('jsdom');
const babelRegister = require('babel-register');

const { JSDOM } = jsdom;

babelRegister({
    presets: ['env', 'react', 'stage-2'],
    extensions: ['', '.js'],
});

const { document } = new JSDOM(
    '<!doctype html><html><body></body></html>',
).window;
global.document = document;
global.window = document.defaultView;
global.window.device = { uuid: 'string' };

global.navigator = { userAgent: 'node.js', platform: 'Chrome' };
