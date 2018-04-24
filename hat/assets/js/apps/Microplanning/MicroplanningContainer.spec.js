/* global describe, it, beforeEach, afterEach */
import assert from 'assert';
import React from 'react';
import { createStore } from 'redux';
import nock from 'nock';
import sinon from 'sinon';
import { renderWithStore } from '../../test/utils';

import { urls, MicroplanningContainer } from './MicroplanningContainer';
import { selectionInitialState } from './redux/selection';
import { mapInitialState } from './redux/map';

// create a single nock scope chaining all requests
function createNockScope() {
    const ns = nock('http://localhost');
    urls.forEach((config) => {
        ns.get(new RegExp(`^${config.url}`)).reply(200, config.mock);
    });
    return ns;
}

describe('MicroplanningContainer Loading Data', () => {
    let reduxStore;
    let defaultProps;
    let nockScope;

    beforeEach(() => {
        defaultProps = {
            config: {},
            load: {},
            selection: selectionInitialState,
            map: mapInitialState,
            params: { caseyears: '2015' },
            dispatch: sinon.spy(),
        };
        reduxStore = createStore(e => e, {
            config: {},
            load: {},
            selection: selectionInitialState,
            map: mapInitialState,
        });
        nockScope = createNockScope();
    });

    afterEach(() => {
        // always cleanup in case any nocks have been leftover
        nock.cleanAll();
    });

    it('loads data on initialization', () => {
        renderWithStore(reduxStore, <MicroplanningContainer {...defaultProps} />);
        assert(nockScope.isDone(), 'The urls have been requested');
    });

    it('loads data when the filter params change', () => {
        const node = document.createElement('div');
        renderWithStore(reduxStore, <MicroplanningContainer {...defaultProps} />, node);
        assert(nockScope.isDone(), 'The urls have been requested');

        // we restore the nocks to test if they will be called again
        nockScope = createNockScope();
        assert(nockScope.isDone() === false, 'The fresh nock scope is not done');

        const props2 = {
            ...defaultProps,
            params: {
                ...defaultProps.params,
                caseyears: '2012',
            },
        };
        renderWithStore(reduxStore, <MicroplanningContainer {...props2} />, node);

        assert(nockScope.isDone(), 'The urls have been requested a second time');
        nockScope = createNockScope();

        const props3 = {
            ...defaultProps,
            params: {
                ...defaultProps.params,
                caseyears: '2012',
            },
        };
        renderWithStore(reduxStore, <MicroplanningContainer {...props3} />, node);

        assert(nockScope.isDone() === false, 'The urls have not been requested again');
    });
});
