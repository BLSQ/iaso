import React from 'react';
import nock from 'nock';

import DevicesList from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';
import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';

const requests = [
    {
        url: '/api/devices/?&limit=10&page=1&order=-created_at',
        body: {
            devices: [],
        },
    },
];

describe('Devices component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mounts properly', () => {
        const connectedWrapper = mount(
            renderWithMuiTheme(
                renderWithStore(
                    <DevicesList params={{ order: '-created_at' }} />,
                ),
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call devices api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
