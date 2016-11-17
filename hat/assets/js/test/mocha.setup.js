var jsdom = require('jsdom')
var babelRegister = require('babel-register')

babelRegister({
  presets: ['es2015', 'react', 'stage-2'],
  extensions: ['', '.js']
})

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.window.device = {uuid: 'string'}

global.navigator = {userAgent: 'node.js', platform: 'Chrome'}

// make leaflet work and render SVG
global.console.debug = () => {}
global.L = require('leaflet')
global.L.Browser.svg = true

// ignore webpack loader imports
var noop = function () {}
require.extensions['.scss'] = noop
require.extensions['.css'] = noop
require.extensions['.ttf'] = noop
