import React from 'react';
import nock from 'nock';

import ConnectedInstances from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';
import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';

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
        url: `/api/periods/?form_id=${formId}`,
        body: {
            devicesownership: [],
        },
    },
    {
        url: `/api/orgunits/?&parent_id=0&defaultVersion=true&validation_status=all`,
        body: {
            orgunits: [],
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

describe('Instances connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithMuiTheme(
                renderWithStore(
                    <ConnectedInstances
                        params={{ formId }}
                        router={{ goBack: () => null }}
                    />,
                ),
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call completeness api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
