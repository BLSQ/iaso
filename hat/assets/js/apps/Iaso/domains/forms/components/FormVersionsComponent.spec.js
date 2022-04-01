import React from 'react';
import nock from 'nock';

import FormVersionsComponent from './FormVersionsComponent';
import FormVersionsDialog from './FormVersionsDialogComponent';
import SingleTable from '../../../components/tables/SingleTable';
import { renderWithStore } from '../../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../../test/utils/requests';

const formId = 1;
const requests = [
    {
        url: `/api/formversions/**/*`,
        body: {
            form_versions: [],
            count: 0,
            pages: 0,
        },
    },
];

let connectedWrapper;
let singleTable;
let formVersionsDialog;

const cleanAndMock = () => {
    nock.cleanAll();
    nock.abortPendingRequests();
    mockGetRequestsList(requests);
};
let setForceRefreshSpy = sinon.spy();

describe('FormVersionsComponent connected component', () => {
    before(() => {
        cleanAndMock();
    });

    it('mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(
                <FormVersionsComponent
                    setForceRefresh={() => setForceRefreshSpy()}
                    formId={formId}
                />,
            ),
        );
        connectedWrapper.update();
        connectedWrapper.update();
        connectedWrapper.update();
        expect(connectedWrapper.exists()).to.equal(true);
    });
    describe('should connect to api', () => {
        it('and call forms api', () => {
            // updating because the api call is not made on first render
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });

    describe('FormVersionsDialog', () => {
        it('should render', () => {
            formVersionsDialog = connectedWrapper.find(FormVersionsDialog);
            expect(formVersionsDialog).to.have.lengthOf(1);
        });
        it('should trigger setForceRefresh if trigger onConfirmed', () => {
            formVersionsDialog.props().onConfirmed();
            expect(setForceRefreshSpy.calledOnce).to.equal(true);
        });
    });

    describe('SingleTable', () => {
        it('should render', () => {
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable).to.have.lengthOf(1);
        });
        it('should trigger setForceRefresh if trigger onForceRefreshDone', () => {
            setForceRefreshSpy = sinon.spy();
            singleTable.props().onForceRefreshDone();
            expect(setForceRefreshSpy.calledOnce).to.equal(true);
        });
        it('not render', () => {
            cleanAndMock();
            connectedWrapper = mount(
                renderWithStore(<FormVersionsComponent formId={null} />),
            );
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable).to.have.lengthOf(0);
            cleanAndMock();
            connectedWrapper = mount(
                renderWithStore(<FormVersionsComponent formId={null} />),
            );
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable).to.have.lengthOf(0);
        });
    });
});
