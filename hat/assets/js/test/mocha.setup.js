const jsdom = require('jsdom')
const babelRegister = require('babel-register')

babelRegister({
  presets: ['es2015', 'react', 'stage-2'],
  extensions: ['', '.js']
})

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.window.device = {uuid: 'string'}

global.navigator = {userAgent: 'node.js', platform: 'Chrome'}
