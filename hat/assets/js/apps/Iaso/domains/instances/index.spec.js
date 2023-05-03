import React from 'react';
import nock from 'nock';

import ConnectedInstances from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';
import { withQueryClientProvider } from '../../../../test/utils';

const formId = 1;
const requests = [
    {
        url: '/api/orgunittypes/',
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/devices/',
        body: {
            devices: [],
        },
    },
    {
        url: '/api/devicesownerships/',
        body: {
            devicesownership: [],
        },
    },
    {
        url: `/api/forms/?all=true&order=name&fields=name%2Cperiod_type%2Clabel_keys%2Cid`,
        forms: {},
    },
];

let connectedWrapper;

describe.skip('Instances connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });
    it('mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(
                withQueryClientProvider(
                    <ConnectedInstances
                        params={{ formId, tab: 'map' }}
                        router={{ goBack: () => null }}
                    />,
                ),
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });
    it.skip('should connect and call the api', () => {
        expect(nock.activeMocks()).to.have.lengthOf(0);
    });
});
