import React from 'react';
import nock from 'nock';

import { expect } from 'chai';
import FormFormComponent from './FormFormComponent';
import SingleTable from '../../../components/tables/SingleTable';
import LoadingSpinner from '../../../components/LoadingSpinnerComponent';
import { renderWithStore } from '../../../../../test/utils/redux';
import formsFixture from '../fixtures/forms.json';
import TopBar from '../../../components/nav/TopBarComponent';

const projectActions = require('../../projects/actions');
const orgUnitTypesActions = require('../../orgUnits/types/actions');
const redirectActions = require('../../../routing/actions');
const requestsStub = require('../../../utils/requests');

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
        keyValue: 'name',
        newValue: newName,
    },
    {
        keyValue: 'period_type',
        newValue: null,
    },
    {
        keyValue: 'period_type',
        newValue: 'period_type',
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
];

const currentForm = {
    id: { value: 69 },
    name: { value: 'ZELDA' },
    short_name: { value: 'ZELDA' },
    depth: { value: 0 },
    org_unit_type_ids: { value: [1] },
    project_ids: { value: [1] },
    period_type: { value: null },
    derived: { value: false },
    single_per_period: { value: false },
    periods_before_allowed: { value: 0 },
    periods_after_allowed: { value: 0 },
    device_field: { value: 'deviceid' },
    location_field: { value: '' },
};

const setFieldValueSpy = sinon.spy();
describe('FormFormComponent connected component', () => {
    describe('with a full form', () => {
        before(() => {
            connectedWrapper = mount(
                renderWithStore(
                    <FormFormComponent
                        currentForm={currentForm}
                        setFieldValue={() => {
                            setFieldValueSpy();
                        }}
                    />,
                    {
                        projects: {
                            allProjects: [
                                {
                                    name: "Majora's mask",
                                    id: 0,
                                },
                            ],
                        },
                        orgUnitsTypes: {
                            allTypes: [
                                {
                                    name: 'GAME',
                                    id: 0,
                                },
                            ],
                        },
                    },
                ),
            );
        });
        it('mount properly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });
        it('on inputs change update input value', () => {
            inputsList.forEach(i => {
                const element = connectedWrapper
                    .find(`[keyValue="${i.keyValue}"]`)
                    .at(0);
                element.props().onChange(i.keyValue, i.newValue);
                connectedWrapper.update();
            });
            // Count went from 16 to 17 switchint to Select input because there's an additional call in a useEffect hook
            expect(setFieldValueSpy.callCount).to.equal(17);
        });
        it('mount properly without org_unit_type_ids and project_ids', () => {
            connectedWrapper = mount(
                renderWithStore(
                    <FormFormComponent
                        currentForm={{
                            ...currentForm,
                            org_unit_type_ids: { value: [] },
                            project_ids: { value: [] },
                        }}
                        setFieldValue={() => {
                            setFieldValueSpy();
                        }}
                    />,
                    {
                        projects: {
                            allProjects: [],
                        },
                        orgUnitsTypes: {
                            allTypes: [],
                        },
                    },
                ),
            );
            expect(connectedWrapper.exists()).to.equal(true);
        });
        it('mount properly without projects and orgUnitsTypes', () => {
            connectedWrapper = mount(
                renderWithStore(
                    <FormFormComponent
                        currentForm={{
                            ...currentForm,
                            org_unit_type_ids: { value: [] },
                            project_ids: { value: [] },
                        }}
                        setFieldValue={() => {
                            setFieldValueSpy();
                        }}
                    />,
                    {
                        projects: {
                            allProjects: null,
                        },
                        orgUnitsTypes: {
                            allTypes: null,
                        },
                    },
                ),
            );
            expect(connectedWrapper.exists()).to.equal(true);
        });
    });
});
