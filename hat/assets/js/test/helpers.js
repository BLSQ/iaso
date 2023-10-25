import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { configure, mount, render, shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import nodeFetch from 'node-fetch';
import { mockMessages } from './utils/intl';
import { baseUrl as baseUrlConst } from './utils/requests';

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

const mock = require('mock-require');

mock('@mui/material/Dialog', ({ children }) => <>{children}</>);
// Don't load svg strings into tests
require.extensions['.svg'] = obj => {
    // eslint-disable-next-line no-param-reassign
    obj.exports = () => <svg>SVG_TEST_STUB</svg>;
};
