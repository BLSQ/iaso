import React from 'react';
import nock from 'nock';
import { AddButton as AddButtonComponent } from 'bluesquare-components';

import { expect } from 'chai';
import { withQueryClientProvider } from '../../../../test/utils';
import Forms from './index';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import { renderWithStore } from '../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../test/utils/requests';

const redirectActions = require('../../routing/actions');

const requests = [
    {
        url: '/api/forms/?&all=true&limit=10&page=1&order=-created_at',
        body: {
            forms: [],
            pages: 0,
        },
    },
];

const requestsForArchivedForms = [
    {
        url: '/api/forms/?&all=true&showDeleted=true&limit=10&page=1&order=-created_at',
        body: {
            forms: [],
            pages: 0,
        },
    },
];

const requestForDeletedForms = [
    {
        url: '/api/forms/?&order=instance_updated_at&page=1&showDeleted=true&searchActive=true&all=true&limit=50&undefined=true',
        body: {
            forms: [],
            pages: 0,
        },
    },
];

const userWithFormPermission = {
    users: {
        current: {
            id: 1,
            account: { name: '' },
            permissions: ['iaso_forms'],
        },
    },
};

const forms = ({ withPermissions, showOnlyDeleted = false }) =>
    mount(
        withQueryClientProvider(
            renderWithStore(
                <Forms params={{}} showOnlyDeleted={showOnlyDeleted} />,
                withPermissions ? userWithFormPermission : null,
            ),
        ),
    );

let connectedWrapper;
let addButton;
let redirectAction;
let singleTable;

describe('Forms connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
        connectedWrapper = forms({ withPermissions: true });
    });

    it('mounts properly', () => {
        expect(connectedWrapper.exists()).to.equal(true);
    });

    it('renders TopBar', () => {
        expect(connectedWrapper.find(TopBar)).to.have.lengthOf(1);
    });

    describe('When connecting to API', () => {
        it('makes all expected calls', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
    describe('SingleTable', () => {
        it('renders', () => {
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable.exists()).to.equal(true);
        });
        it('updates forceRefresh', () => {
            singleTable.props().onForceRefreshDone();
            expect(singleTable.props().forceRefresh).to.equal(false);
        });
    });

    describe('Archived Forms', () => {
        it('mounts properly', () => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockGetRequestsList(requestsForArchivedForms);
            connectedWrapper = forms({
                withPermissions: true,
                showOnlyDeleted: true,
            });
            expect(connectedWrapper.exists()).to.equal(true);
        });
    });
    describe('Deleted Forms', () => {
        it('mounts properly', () => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockGetRequestsList(requestForDeletedForms);
            connectedWrapper = forms({
                withPermissions: true,
                showOnlyDeleted: true,
            });
            expect(connectedWrapper.exists()).to.equal(true);
        });
    });
    describe('When iaso_forms permission is present', () => {
        before(() => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockGetRequestsList(requests);
            connectedWrapper = forms({ withPermissions: true });
        });
        describe('AddButtonComponent', () => {
            before(() => {
                addButton = connectedWrapper.find(AddButtonComponent);
                redirectAction = sinon
                    .stub(redirectActions, 'redirectTo')
                    .returns({
                        type: 'LINK',
                    });
            });
            after(() => {
                sinon.restore();
            });
            it('is present', () => {
                expect(addButton.exists()).to.equal(true);
            });
            it('redirects on click', () => {
                addButton.props().onClick();
                expect(redirectAction).to.have.been.called;
            });
        });
    });
    describe('When iaso_forms permission is not present', () => {
        before(() => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockGetRequestsList(requests);
            connectedWrapper = forms({ withPermissions: false });
        });
        describe('AddButtonComponent', () => {
            before(() => {
                addButton = connectedWrapper.find(AddButtonComponent);
            });
            it('is not present', () => {
                expect(addButton.exists()).to.equal(false);
            });
        });
    });
});
