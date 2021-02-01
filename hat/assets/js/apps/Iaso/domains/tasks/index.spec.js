import React from 'react';
import nock from 'nock';

import TasksList from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { renderWithStore } from '../../../../test/utils/redux';
import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';

const requests = [
    {
        url: '/api/tasks/?order=created_at&limit=20&page=1',
        body: {
            tasks: [],
        },
    },
];

describe('Tasks component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mounts properly', () => {
        const connectedWrapper = mount(
            renderWithMuiTheme(renderWithStore(<TasksList params={{}} />)),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call tasks api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
