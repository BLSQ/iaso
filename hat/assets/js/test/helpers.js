// Mock the LANGUAGE_CONFIGS module
import React from 'react';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, render, shallow } from 'enzyme';
import nodeFetch from 'node-fetch';
import sinon from 'sinon';
import './utils/pdf';
import { mockMessages } from './utils/intl';
import { baseUrl as baseUrlConst } from './utils/requests';
import { expect } from 'chai';

const mockLANGUAGE_CONFIGS = {
    en: {
        dateFormats: {
            LT: 'h:mm A',
            LTS: 'DD/MM/YYYY HH:mm',
            L: 'DD/MM/YYYY',
            LL: 'Do MMMM YYYY',
            LLL: 'Do MMMM YYYY LT',
            LLLL: 'dddd, MMMM Do YYYY LT',
        },
    },
    fr: {
        dateFormats: {
            LT: 'HH:mm',
            LTS: 'DD/MM/YYYY HH:mm',
            L: 'DD/MM/YYYY',
            LL: 'Do MMMM YYYY',
            LLL: 'Do MMMM YYYY LT',
            LLLL: 'dddd, MMMM Do YYYY LT',
        },
    },
};

// Set up the mock
require('mock-require')('IasoModules/language/configs', {
    LANGUAGE_CONFIGS: mockLANGUAGE_CONFIGS,
});

configure({ adapter: new Adapter() });

// Node-fetch don't support absolute url since it's server side
// prepend all url with our base

const fetchAbsolute =
    fetch =>
    baseUrl =>
    (init, ...params) => {
        if (typeof init === 'string' && init.startsWith('/')) {
            return fetch(baseUrl + init, ...params);
        }
        return fetch(init, ...params);
    };
global.fetch = fetchAbsolute(nodeFetch)(baseUrlConst);
global.Request = nodeFetch.Request;

global.expect = expect;

global.sinon = sinon;

global.mount = mount;
global.render = render;
global.shallow = shallow;

mockMessages();

const chai = require('chai');
chai.use(require('sinon-chai'));

// Don't load svg strings into tests
require.extensions['.svg'] = obj => {
    // eslint-disable-next-line no-param-reassign
    obj.exports = () => 'SVG_TEST_STUB';
};
