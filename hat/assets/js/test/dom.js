import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');

function copyProps(src, target) {
    const props = Object.getOwnPropertyNames(src)
        .filter(prop => typeof target[prop] === 'undefined')
        .reduce(
            (result, prop) => ({
                ...result,
                [prop]: Object.getOwnPropertyDescriptor(src, prop),
            }),
            {},
        );
    Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.cookie = 'django_language=fr;';
global.navigator = {
    userAgent: 'node.js',
    platform: 'Mac',
    appName: 'Chrome',
    language: 'en',
};
global.STATIC_URL = '';
global.PLUGIN_POLIO_ENABLED = false;
global.L = require('leaflet');

copyProps(window, global);

const doNothing = () => null;

require.extensions['.css'] = doNothing;
require.extensions['.less'] = doNothing;
require.extensions['.scss'] = doNothing;
