import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost:8081',
});

window.AVAILABLE_LANGUAGES = ['en', 'fr'];
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
// Update navigator properties instead of replacing the entire object
Object.defineProperty(global.navigator, 'userAgent', {
    value: 'node.js',
    writable: true,
    configurable: true,
});
Object.defineProperty(global.navigator, 'platform', {
    value: 'Mac',
    writable: true,
    configurable: true,
});
Object.defineProperty(global.navigator, 'appName', {
    value: 'Chrome',
    writable: true,
    configurable: true,
});
Object.defineProperty(global.navigator, 'language', {
    value: 'en',
    writable: true,
    configurable: true,
});
global.L = require('leaflet');

copyProps(window, global);

const doNothing = () => null;

require.extensions['.png'] = doNothing;
require.extensions['.jpg'] = doNothing;
require.extensions['.css'] = doNothing;
require.extensions['.less'] = doNothing;
require.extensions['.scss'] = doNothing;
