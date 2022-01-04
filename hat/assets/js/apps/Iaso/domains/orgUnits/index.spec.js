import React from 'react';
import nock from 'nock';

import ConnectedOrgUnits from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

const params = {
    searches: '[]',
};

const requests = [
    {
        url: '/api/datasources/',
        body: {
            sources: [],
        },
    },
];

describe('OrgUnits connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(
                <ConnectedOrgUnits params={params} currentUser={{}} />,
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
