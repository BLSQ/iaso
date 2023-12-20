import React from 'react';
import nock from 'nock';

import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';
import ConnectedCompleteness from './index';

import { mockGetRequestsList } from '../../../../test/utils/requests';
import { withQueryClientProvider } from '../../../../test/utils';
import { renderWithIntl } from '../../../../test/utils/intl';
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
            renderWithIntl(
                renderWithMuiTheme(
                    withQueryClientProvider(
                        renderWithStore(<ConnectedCompleteness params={{}} />),
                    ),
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
