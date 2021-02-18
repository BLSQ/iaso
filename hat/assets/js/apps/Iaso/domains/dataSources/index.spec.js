import React from 'react';
import nock from 'nock';

import DataSourcesList from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

const requests = [
    {
        url: '/api/datasources/?&limit=10&page=1&order=-created_at',
        body: {
            sources: [],
        },
    },
];

describe('Data sources component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mounts properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<DataSourcesList params={{}} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call datasources api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
