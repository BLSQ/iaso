import React from 'react';

import { expect } from 'chai';
import FormFormComponent from './FormFormComponent';
import { renderWithStore } from '../../../../../test/utils/redux';
import { withQueryClientProvider } from '../../../../../test/utils';

let connectedWrapper;

const newName = 'ZELDA';

const baseSettings = [
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
];

const advancedSettings = [
    {
        keyValue: 'device_field',
        newValue: 'device_field',
    },
    {
        keyValue: 'location_field',
        newValue: 'location_field',
    },
    {
        keyValue: 'label_keys',
        newValue: 'booomerang',
    },
    {
        keyValue: 'derived',
        newValue: true,
    },
];

const inputsList = [...baseSettings, ...advancedSettings];

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
    label_keys: { value: 'blue candle' },
    possible_fields: {
        value: [
            { label: 'blue candle', name: 'bc', type: 'string' },
            { label: 'boomerang', name: 'bg', type: 'string' },
        ],
    },
    location_field: { value: '' },
};

const setFieldValueSpy = sinon.spy();
describe('FormFormComponent connected component', () => {
    describe('with a full form', () => {
        before(() => {
            connectedWrapper = mount(
                withQueryClientProvider(
                    renderWithStore(
                        <FormFormComponent
                            currentForm={currentForm}
                            setFieldValue={() => {
                                setFieldValueSpy();
                            }}
                        />,
                    ),
                ),
            );
        });
        it('mount properly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });
        it('displays only base settings settings on mount', () => {
            baseSettings.forEach(setting => {
                const input = connectedWrapper
                    .find(`[keyValue="${setting.keyValue}"]`)
                    .at(0);
                expect(input.exists()).to.equal(true);
            });
            advancedSettings.forEach(setting => {
                const input = connectedWrapper
                    .find(`[keyValue="${setting.keyValue}"]`)
                    .at(0);
                expect(input.exists()).to.equal(false);
            });
        });

        it('mount properly without org_unit_type_ids and project_ids', () => {
            connectedWrapper = mount(
                withQueryClientProvider(
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
                    ),
                ),
            );
            expect(connectedWrapper.exists()).to.equal(true);
        });
        it('mount properly without projects and orgUnitsTypes', () => {
            connectedWrapper = mount(
                withQueryClientProvider(
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
                    ),
                ),
            );
            expect(connectedWrapper.exists()).to.equal(true);
        });
    });
});
