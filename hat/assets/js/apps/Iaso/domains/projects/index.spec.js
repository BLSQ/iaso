import React from 'react';
import nock from 'nock';

import AppsList from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

const requests = [
    {
        url: '/api/projects/?order=undefined&limit=undefined&page=undefined',
        body: {
            apps: [],
        },
    },
    {
        url: '/api/featureflags/',
    },
];

describe('Project (apps) component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mounts properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<AppsList params={{}} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call projects api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
