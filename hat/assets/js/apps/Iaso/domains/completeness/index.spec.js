import React from 'react';
import nock from 'nock';

import ConnectedCompleteness from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

const requests = [
    {
        url: '/api/completeness/',
        body: {
            completeness: [],
        },
    },
];

describe('Completeness connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<ConnectedCompleteness params={{}} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call completeness api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
