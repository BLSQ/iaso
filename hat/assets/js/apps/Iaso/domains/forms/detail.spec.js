import React from 'react';
import nock from 'nock';

import Detail from './detail';
import SingleTable from '../../components/tables/SingleTable';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import { renderWithStore } from '../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../test/utils/requests';
import formsFixture from './fixtures/forms.json';

const formId = '69';
const requests = [
    {
        url: `/api/forms/${formId}/`,
        body: {},
    },
    {
        url: `/api/orgunittypes/`,
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: `/api/projects/`,
        body: {
            projects: [],
        },
    },
    {
        url: `/api/formversions/?&limit=10&page=1&order=-created_at&form_id=${formId}`,
        body: {
            form_versions: [],
            pages: 0,
        },
    },
];

let connectedWrapper;
let singleTable;
const fakeForm = formsFixture.forms[0];

describe('Detail form connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);
    });

    it('mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(
                <Detail params={{ formId }} router={{ goBack: () => null }} />,
                {
                    forms: {
                        current: fakeForm,
                    },
                },
            ),
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

    it('display loadingSpinner if is loading', () => {
        connectedWrapper = mount(
            renderWithStore(
                <Detail params={{ formId }} router={{ goBack: () => null }} />,
                {
                    forms: {
                        current: fakeForm,
                        isLoading: true,
                    },
                },
            ),
        );
        const loader = connectedWrapper.find(LoadingSpinner);
        expect(loader).to.have.lengthOf(1);
    });
});
