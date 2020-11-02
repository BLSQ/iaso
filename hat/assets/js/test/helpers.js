import sinon from 'sinon';
import { expect } from 'chai';
import { mount, render, shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { mockMessages } from './utils/intl';

configure({ adapter: new Adapter() });

global.expect = expect;

global.sinon = sinon;

global.mount = mount;
global.render = render;
global.shallow = shallow;

mockMessages();

const chai = require('chai');
chai.use(require('sinon-chai'));
