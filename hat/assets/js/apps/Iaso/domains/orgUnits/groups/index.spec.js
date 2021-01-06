import React from 'react';
import nock from 'nock';

import ConnectedGroups from './index';

import { mockGetRequestsList } from '../../../../../test/utils/requests';
import { renderWithStore } from '../../../../../test/utils/redux';

const params = {
    order: 'hyrule',
    pageSize: 0,
    page: 69,
};

const requests = [
    {
        url: `/api/groups/?order=${params.order}&limit=${params.pageSize}&page=${params.page}`,
        body: {
            groups: [],
        },
    },
];

describe('Groups connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<ConnectedGroups params={params} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
