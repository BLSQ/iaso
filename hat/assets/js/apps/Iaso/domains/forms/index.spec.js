import React from 'react';
import nock from 'nock';

import Forms from './index';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import { renderWithStore } from '../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../test/utils/requests';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';

const redirectActions = require('../../routing/actions');

const requests = [
    {
        url: '/api/projects/',
        body: {
            projects: [],
        },
    },
    {
        url: '/api/orgunittypes/',
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/forms/?&all=true&limit=10&page=1&order=-created_at',
        body: {
            forms: [],
        },
    },
];

let connectedWrapper;
let addButton;
let redirectAction;

describe('Forms connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        connectedWrapper = mount(renderWithStore(<Forms params={{}} />));
        expect(connectedWrapper.exists()).to.equal(true);
    });

    it('render TopBar', () => {
        expect(connectedWrapper.find(TopBar)).to.have.lengthOf(1);
    });

    it('render SingleTable', () => {
        const singleTable = connectedWrapper.find(SingleTable);
        expect(singleTable).to.have.lengthOf(1);
    });

    describe('AddButtonComponent', () => {
        before(() => {
            addButton = connectedWrapper.find(AddButtonComponent);
            redirectAction = sinon.stub(redirectActions, 'redirectTo').returns({
                type: 'LINK',
            });
        });
        after(() => {
            sinon.restore();
        });
        it('should be present', () => {
            expect(addButton).to.have.lengthOf(1);
        });
        it('click should trigger redirect action', () => {
            expect(addButton).to.have.lengthOf(1);
            addButton.props().onClick();
            expect(redirectAction).to.have.been.called;
        });
    });

    describe('should connect to api', () => {
        it('and call forms api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
