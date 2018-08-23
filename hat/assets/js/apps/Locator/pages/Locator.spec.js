/* global describe, it, beforeEach, afterEach */
import assert from 'assert';
import React from 'react';
import { createStore } from 'redux';
import nock from 'nock';
import sinon from 'sinon';
import { renderWithStore } from '../../../test/utils';
import { locatorInitialState, locatorActions } from '../redux/locator';
import { mapInitialState } from '../redux/mapReducer';
import { provinceActions } from '../redux/province';
import { caseActions } from '../redux/case';

import { Locator } from './Locator';

const createNockScope = () => {
    const ns = nock('http://localhost').persist();
    ns.get('/api/provinces/').reply(200, () => []);
    ns.get('/api/cases/1').reply(200, () => ({
        normalized_AS_dict: {},
    }));
    return ns;
};
locatorInitialState.villages = null;

describe('Locator Loading Data', () => {
    window.HTMLCanvasElement.prototype.getContext = () => ({});
    let reduxStore;
    let defaultProps;
    let nockScope;
    let node;
    const dispatch = sinon.spy();

    beforeEach(() => {
        defaultProps = {
            intl: {
                formatMessage: () => { },
            },
            redirectTo: () => { },
            fetchProvinces: () => provinceActions.fetchProvinces(dispatch),
            locatorState: locatorInitialState,
            selectProvince: () => { },
            selectZone: (zoneId, currentTypes) => locatorActions.selectZone(zoneId, currentTypes, dispatch, true, 1),
            selectArea: (areaId, currentTypes, zoneId) => locatorActions.selectArea(areaId, currentTypes, dispatch, true, zoneId),
            resetSearch: () => { },
            load: {},
            params: {
                order: 'form_year',
                pageSize: '50',
                page: '1',
                years: '2017,2016,2015,2014,2013',
                case_id: '1',
            },
            dispatch,
            kase: {},
            searchVillage: () => { },
            saveVillage: () => { },
            getShape: () => { },
            selectVillage: () => { },
            selectType: () => { },
            fetchCase: caseId => caseActions.fetchCase(dispatch, caseId),
            changeLayer: () => { },
            map: mapInitialState,
        };
        reduxStore = createStore(e => e, {
            load: {},
            locatorState: locatorInitialState,
            kase: {},
            map: mapInitialState,
        });
        nockScope = createNockScope();
        node = document.createElement('div');
        renderWithStore(reduxStore, <Locator {...defaultProps} />, node);
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('loads provinces and case on initialization', () => {
        assert(nockScope.isDone(), 'urls have been requested');
    });
});
