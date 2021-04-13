import React from 'react';
import nock from 'nock';

import FormVersionsComponent from './FormVersionsComponent';
import SingleTable from '../../../components/tables/SingleTable';
import { renderWithStore } from '../../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../../test/utils/requests';

const formId = '69';
const requests = [
    {
        url: `/api/formversions/?&limit=10&page=1&order=-created_at&form_id=${formId}`,
        body: {
            form_versions: [],
        },
    },
];

let connectedWrapper;
let singleTable;

describe('FormVersionsComponent connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(<FormVersionsComponent formId={formId} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });
    describe('SingleTable', () => {
        it('should render', () => {
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable).to.have.lengthOf(1);
        });
        it('should render', () => {
            singleTable = connectedWrapper.find(SingleTable);
            expect(singleTable).to.have.lengthOf(1);
        });
    });

    describe('should connect to api', () => {
        it('and call forms api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
