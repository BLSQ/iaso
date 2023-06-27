import React from 'react';
import nock from 'nock';

import { Links } from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

const requests = [
    {
        url: '/api/v2/orgunittypes/',
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/algorithms/',
        body: {
            algorithms: [],
        },
    },
    {
        url: '/api/algorithmsruns/',
        body: {
            algorithmsruns: [],
        },
    },
    {
        url: '/api/datasources/',
        body: {
            datasources: [],
        },
    },
    {
        url: '/api/profiles/',
        body: {
            profiles: [],
        },
    },
];

describe('Links connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(
                <Links params={{}} router={{ goBack: () => null }} />,
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
