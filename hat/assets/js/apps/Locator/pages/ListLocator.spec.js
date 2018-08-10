/* global describe, it, beforeEach, afterEach */
import assert from 'assert';
import React from 'react';
import { createStore } from 'redux';
import nock from 'nock';
import sinon from 'sinon';
import { renderWithStore } from '../../../test/utils';
import { locatorInitialState, locatorActions } from '../redux/locator';
import { provinceActions } from '../redux/province';

import { ListLocator } from './ListLocator';

const createNockScope = () => {
    const ns = nock('http://localhost').persist();
    ns.get('/api/provinces/').reply(200, () => []);
    ns.get('/api/teams/').reply(200, () => []);
    return ns;
};
const createNockScopeCases = () => {
    const ns = nock('http://localhost').persist();
    ns.get(new RegExp('^/api/cases/?')).reply(200, () => ({
        count: 0,
        cases: [],
    }));
    return ns;
};

describe.only('ListLocator Loading Data', () => {
    window.HTMLCanvasElement.prototype.getContext = () => ({});
    let reduxStore;
    let defaultProps;
    let nockScope;
    let nockScopeCases;
    let node;
    const dispatch = sinon.spy();

    beforeEach(() => {
        defaultProps = {
            intl: {
                formatMessage: () => {},
            },
            redirectTo: () => {},
            fetchProvinces: () => provinceActions.fetchProvinces(dispatch),
            listFilters: locatorInitialState,
            selectProvince: () => {},
            selectZone: () => {},
            selectArea: () => {},
            resetSearch: () => {},
            fetchTeams: () => locatorActions.fetchTeams(dispatch),
            load: {},
            params: {
                order: 'form_year',
                pageSize: '50',
                page: '1',
                years: '2017,2016,2015,2014,2013',
            },
            dispatch,
        };
        reduxStore = createStore(e => e, {
            load: {},
            listFilters: locatorInitialState,
            kase: {},
        });
        nockScope = createNockScope();
        nockScopeCases = createNockScopeCases();
        node = document.createElement('div');
        renderWithStore(reduxStore, <ListLocator {...defaultProps} />, node);
    });

    afterEach(() => {
        // always cleanup in case any nocks have been leftover
        nock.cleanAll();
    });

    it('loads provinces, teams and cases on initialization', () => {
        assert(nockScope.isDone(), 'provinces and teams have been requested');
        assert(nockScopeCases.isDone(), 'cases has been requested');
    });

    it('loads cases when the filter params change', () => {
        assert(nockScope.isDone(), 'provinces and teams have been requested');
        assert(nockScopeCases.isDone(), 'cases has been requested');
        nock.cleanAll();
        nockScope = createNockScope();
        nockScopeCases = createNockScopeCases();
        const props2 = {
            ...defaultProps,
            params: {
                ...defaultProps.params,
                years: '2012',
            },
        };
        renderWithStore(reduxStore, <ListLocator {...props2} />, node);
        assert(nockScope.isDone() === false, 'provinces and teams have not been requested');
        assert(nockScopeCases.isDone(), 'cases has been requested again');
    });
});
