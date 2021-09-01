import React from 'react';
import nock from 'nock';

import ConnectedInstances from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';

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
        url: '/api/devicesownership/',
        body: {
            devicesownership: [],
        },
    },
    {
        url: `/api/forms/${formId}/`,
        body: {},
    },
    {
        url: `/api/instances/?&limit=20&order=-updated_at&page=1&asSmallDict=true&form_id=${formId}`,
        body: {
            instances: [],
        },
    },
    {
        url: `/api/instances/?&order=-updated_at&asSmallDict=true&form_id=${formId}&asSmallDict=true`,
        body: [],
    },
];

let connectedWrapper;

describe('Instances connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });
    it('mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(
                <ConnectedInstances
                    params={{ formId, tab: 'map' }}
                    router={{ goBack: () => null }}
                />,
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });
    it('should connect and call the api', () => {
        expect(nock.activeMocks()).to.have.lengthOf(0);
    });
});
