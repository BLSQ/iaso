import React from 'react';
import nock from 'nock';

import { expect } from 'chai';
import Detail from './detail';
import SingleTable from '../../components/tables/SingleTable';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import { renderWithStore } from '../../../../test/utils/redux';
import {
    mockGetRequestsList,
    mockPostRequest,
    mockPostRequestError,
    mockDeleteRequestError,
    mockDeleteRequest,
} from '../../../../test/utils/requests';
import formsFixture from './fixtures/forms.json';
import TopBar from '../../components/nav/TopBarComponent';

const projectActions = require('../projects/actions');
const orgUnitTypesActions = require('../orgUnits/types/actions');
const redirectActions = require('../../routing/actions');
const requestsStub = require('../../utils/requests');

const requests = theId => [
    {
        url: `/api/forms/${theId}/`,
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
        url: `/api/formversions/?&limit=10&page=1&order=-created_at&form_id=${theId}`,
        body: {
            form_versions: [],
            pages: 0,
        },
    },
];

let connectedWrapper;
let singleTable;
let topBar;
let redirectAction;

const newName = 'ZELDA';
const fakeForm = formsFixture.forms[0];
const formId = '69';
const newFile = new File([''], 'filename.txt', {
    type: 'text/plain',
    lastModified: new Date(),
});
const inputsList = [
    {
        keyValue: 'period_type',
        newValue: 'period_type',
    },
    {
        keyValue: 'period_type',
        newValue: null,
    },
    {
        keyValue: 'periods_before_allowed',
        newValue: 69,
    },
    {
        keyValue: 'periods_after_allowed',
        newValue: 69,
    },
    {
        keyValue: 'single_per_period',
        newValue: true,
    },
    {
        keyValue: 'project_ids',
        newValue: '69',
    },
    {
        keyValue: 'org_unit_type_ids',
        newValue: '69',
    },
    {
        keyValue: 'device_field',
        newValue: 'device_field',
    },
    {
        keyValue: 'location_field',
        newValue: 'location_field',
    },
    {
        keyValue: 'derived',
        newValue: true,
    },
    {
        keyValue: 'xls_file',
        newValue: newFile,
    },
];

const resetAndMock = theId => {
    nock.cleanAll();
    nock.abortPendingRequests();
    mockGetRequestsList(requests(theId));
};

describe('Detail form connected component', () => {
    describe('with a new form', () => {
        before(() => {
            resetAndMock('0');
            connectedWrapper = mount(
                renderWithStore(
                    <Detail
                        params={{ formId: '0' }}
                        router={{ goBack: () => null }}
                    />,
                    {
                        forms: {
                            current: undefined,
                        },
                    },
                ),
            );
        });
        it('mount properly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });

        it('should fail silently if createForm fails with 400', done => {
            const confirmButton = connectedWrapper
                .find('[data-id="form-detail-confirm"]')
                .at(0);
            let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            inputName.props().onChange('name', newName);
            connectedWrapper.update();
            inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            expect(inputName.props().value).to.equal(newName);
            const createFormStub = sinon
                .stub(requestsStub, 'createForm')
                .returns(
                    new Promise((resolve, reject) =>
                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject({
                            status: 400,
                            details: {
                                project_ids: ['This list may not be empty.'],
                            },
                        }),
                    ),
                );

            confirmButton.props().onClick();
            expect(createFormStub).to.have.been.called;

            sinon.restore();
            setTimeout(() => {
                done();
            }, 100);
        });
        it('should fail silently if createForm fails with 500', done => {
            const confirmButton = connectedWrapper
                .find('[data-id="form-detail-confirm"]')
                .at(0);
            let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            inputName.props().onChange('name', newName);
            connectedWrapper.update();
            inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            expect(inputName.props().value).to.equal(newName);
            const createFormStub = sinon
                .stub(requestsStub, 'createForm')
                .returns(
                    new Promise((resolve, reject) =>
                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject({
                            status: 500,
                        }),
                    ),
                );

            confirmButton.props().onClick();
            expect(createFormStub).to.have.been.called;

            sinon.restore();
            setTimeout(() => {
                done();
            }, 100);
        });
        it('should call create form on confirm', done => {
            nock.cleanAll();
            nock.abortPendingRequests();
            const confirmButton = connectedWrapper
                .find('[data-id="form-detail-confirm"]')
                .at(0);
            let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            inputName.props().onChange('name', newName);
            connectedWrapper.update();
            inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            expect(inputName.props().value).to.equal(newName);
            mockPostRequest('/api/formversions/', {});
            mockDeleteRequest(`/api/forms/${formId}/`, {});
            const createFormStub = sinon
                .stub(requestsStub, 'createForm')
                .returns(new Promise(resolve => resolve({ id: 69 })));

            confirmButton.props().onClick();
            expect(createFormStub).to.have.been.called;

            sinon.restore();
            setTimeout(() => {
                done();
            }, 100);
        });

        // it('should call delete form on form version creation fail', done => {
        //     nock.cleanAll();
        //     nock.abortPendingRequests();
        //     const confirmButton = connectedWrapper
        //         .find('[data-id="form-detail-confirm"]')
        //         .at(0);
        //     let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
        //     inputName.props().onChange('name', newName);
        //     connectedWrapper.update();
        //     inputName = connectedWrapper.find('[keyValue="name"]').at(0);
        //     expect(inputName.props().value).to.equal(newName);
        //     // mockPostRequest('/api/forms/', { id: 69 });

        //     const createFormStub = sinon
        //         .stub(requestsStub, 'createForm')
        //         .returns(new Promise(resolve => resolve({ id: 69 })));
        //     mockPostRequestError('/api/formversions/', {});
        //     mockDeleteRequest(`/api/forms/${formId}/`, {});

        //     confirmButton.props().onClick();
        //     expect(createFormStub).to.have.been.called;

        //     sinon.restore();
        //     setTimeout(() => {
        //         done();
        //     }, 100);
        // });
        // it('should fail silently if delete fail', done => {
        //     nock.cleanAll();
        //     nock.abortPendingRequests();
        //     const confirmButton = connectedWrapper
        //         .find('[data-id="form-detail-confirm"]')
        //         .at(0);
        //     let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
        //     inputName.props().onChange('name', newName);
        //     connectedWrapper.update();
        //     inputName = connectedWrapper.find('[keyValue="name"]').at(0);
        //     expect(inputName.props().value).to.equal(newName);
        //     // mockPostRequest('/api/forms/', { id: 69 });

        //     const createFormStub = sinon
        //         .stub(requestsStub, 'createForm')
        //         .returns(new Promise(resolve => resolve({ id: 69 })));
        //     mockPostRequestError('/api/formversions/', {});
        //     mockDeleteRequestError(`/api/forms/${formId}/`, {});

        //     confirmButton.props().onClick();
        //     expect(createFormStub).to.have.been.called;

        //     sinon.restore();
        //     setTimeout(() => {
        //         done();
        //     }, 100);
        // });
    });

    describe('with a full form', () => {
        before(() => {
            resetAndMock(formId);
            connectedWrapper = mount(
                renderWithStore(
                    <Detail
                        params={{ formId }}
                        router={{ goBack: () => null }}
                    />,
                    {
                        forms: {
                            current: fakeForm,
                        },
                    },
                ),
            );
        });

        it('call forms api', () => {
            expect(connectedWrapper.exists()).to.equal(true);
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });

        it('handleReset should reset form state', () => {
            const cancelButton = connectedWrapper
                .find('[data-id="form-detail-cancel"]')
                .at(0);
            let inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            inputName.props().onChange('name', newName);
            connectedWrapper.update();
            inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            expect(inputName.props().value).to.equal(newName);
            cancelButton.props().onClick();
            connectedWrapper.update();
            inputName = connectedWrapper.find('[keyValue="name"]').at(0);
            expect(inputName.props().value).to.equal(fakeForm.name);
            expect(connectedWrapper.exists()).to.equal(true);
        });
        // it('on inputs change update input value', () => {
        //     inputsList.forEach(i => {
        //         let element = connectedWrapper
        //             .find(`[keyValue="${i.keyValue}"]`)
        //             .at(0);
        //         element.props().onChange(i.keyValue, i.newValue);
        //         connectedWrapper.update();
        //         element = connectedWrapper
        //             .find(`[keyValue="${i.keyValue}"]`)
        //             .at(0);
        //         expect(element.props().value).to.equal(i.newValue);
        //     });
        // });

        describe('on confirm', () => {
            beforeEach(() => {
                nock.cleanAll();
                nock.abortPendingRequests();
                mockPostRequest('/api/formversions/', {});
                mockDeleteRequest(`/api/forms/${formId}/`, {});
            });
            it('should call update form', done => {
                const confirmButton = connectedWrapper
                    .find('[data-id="form-detail-confirm"]')
                    .at(0);

                const updateFormStub = sinon
                    .stub(requestsStub, 'updateForm')
                    .returns(new Promise(resolve => resolve({ id: 69 })));
                confirmButton.props().onClick();
                expect(updateFormStub).to.have.been.called;
                sinon.restore();
                setTimeout(() => {
                    done();
                }, 100);
            });
            // it('should call update form with a file', done => {
            //     let inputName = connectedWrapper
            //         .find('[keyValue="xls_file"]')
            //         .at(0);
            //     inputName.props().onChange('xls_file', newFile);
            //     connectedWrapper.update();
            //     inputName = connectedWrapper
            //         .find('[keyValue="xls_file"]')
            //         .at(0);
            //     expect(inputName.props().value).to.equal(newFile);
            //     const confirmButton = connectedWrapper
            //         .find('[data-id="form-detail-confirm"]')
            //         .at(0);

            //     const updateFormStub = sinon
            //         .stub(requestsStub, 'updateForm')
            //         .returns(new Promise(resolve => resolve({ id: 69 })));
            //     confirmButton.props().onClick();
            //     expect(updateFormStub).to.have.been.called;
            //     sinon.restore();
            //     setTimeout(() => {
            //         done();
            //     }, 100);
            // });
        });

        it('displays loadingSpinner if is loading', () => {
            resetAndMock(formId);
            connectedWrapper = mount(
                renderWithStore(
                    <Detail
                        params={{ formId }}
                        router={{ goBack: () => null }}
                    />,
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
            sinon.restore();
        });
        describe('mount properly', () => {
            beforeEach(() => {
                resetAndMock(formId);
            });
            afterEach(() => {
                sinon.restore();
            });
            it('without org_unit_type_ids and no project_ids', () => {
                const newForm = {
                    ...fakeForm,
                };
                delete newForm.org_unit_type_ids;
                delete newForm.project_ids;
                connectedWrapper = mount(
                    renderWithStore(
                        <Detail
                            params={{ formId }}
                            router={{ goBack: () => null }}
                        />,
                        {
                            forms: {
                                current: newForm,
                            },
                        },
                    ),
                );
                expect(connectedWrapper.exists()).to.equal(true);
            });

            it('with org_unit_type_ids, project_ids in state and does not call org unit type and projects api', () => {
                const fetchAllOrgUnitTypesStub = sinon
                    .stub(orgUnitTypesActions, 'fetchAllOrgUnitTypes')
                    .returns({ type: 'ZELDA' });
                const fetchProjectStub = sinon
                    .stub(projectActions, 'fetchAllProjects')
                    .returns({ type: 'ZELDA' });
                connectedWrapper = mount(
                    renderWithStore(
                        <Detail
                            params={{ formId }}
                            router={{ goBack: () => null }}
                        />,
                        {
                            forms: {
                                current: fakeForm,
                            },
                            orgUnitsTypes: {
                                allTypes: [69],
                            },
                            projects: {
                                allProjects: [69],
                            },
                        },
                    ),
                );
                expect(fetchAllOrgUnitTypesStub).not.to.have.been.called;
                expect(fetchProjectStub).not.to.have.been.called;
                expect(connectedWrapper.exists()).to.equal(true);
            });
        });
        describe('SingleTable', () => {
            it('should render', () => {
                singleTable = connectedWrapper.find(SingleTable);
                expect(singleTable).to.have.lengthOf(1);
            });
        });
        describe('TopBar', () => {
            it('should render', () => {
                topBar = connectedWrapper.find(TopBar);
                expect(topBar).to.have.lengthOf(1);
            });
            describe('on click back', () => {
                it('should redirect without prevPathName', () => {
                    redirectAction = sinon
                        .stub(redirectActions, 'redirectToReplace')
                        .returns({
                            type: 'LINK',
                        });
                    topBar = connectedWrapper.find(TopBar);
                    expect(topBar).to.have.lengthOf(1);
                    topBar.props().goBack();
                    expect(redirectAction).to.have.been.called;
                });
                it('should go back if prevPathName', () => {
                    resetAndMock(formId);
                    const router = {
                        goBack: () => null,
                    };
                    const goBackStub = sinon.stub(router, 'goBack');
                    connectedWrapper = mount(
                        renderWithStore(
                            <Detail params={{ formId }} router={router} />,
                            {
                                routerCustom: {
                                    prevPathname: 'HYRULE',
                                },
                            },
                        ),
                    );
                    topBar = connectedWrapper.find(TopBar);
                    expect(topBar).to.have.lengthOf(1);
                    topBar.props().goBack();
                    expect(goBackStub).to.have.been.called;
                });
                afterEach(() => {
                    sinon.restore();
                });
            });
        });
        after(() => {
            sinon.restore();
        });
    });
});
