import React from 'react';
import nock from 'nock';

import ConnectedTypes from './index';

import { mockGetRequestsList } from '../../../../../test/utils/requests';
import { renderWithStore } from '../../../../../test/utils/redux';

const params = {
    order: 'hyrule',
    pageSize: 0,
    page: 69,
};

const requests = [
    {
        url: `/api/orgunittypes/?order=${params.order}&limit=${params.pageSize}&page=${params.page}`,
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/orgunittypes/',
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/projects/',
        body: {
            projects: [],
        },
    },
];

describe('Org unit types connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<ConnectedTypes params={params} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
