import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';

import { FormikProps } from 'formik';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
} from 'Iaso/api/missions';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MissionOrgUnitTypeInput } from './MissionOrgUnitTypeInput';

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        Field: vi.fn(({ component: Component, ...props }) => (
            <Component {...props} />
        )),
    };
});

vi.mock('Iaso/components/forms/SelectInput', () => ({
    SelectInput: (props: any) => (
        <button
            data-testid="select-input"
            onClick={() => props.onChange('org_unit_type', 12)}
        >
            Select
        </button>
    ),
}));

vi.mock('Iaso/components/forms/NumberInput', () => ({
    NumberInput: () => <div data-testid="number-input" />,
}));

const missionFormsBaseInputMock = vi.fn();

vi.mock('Iaso/domains/missions/components/forms/MissionFormsBaseInput', () => ({
    MissionFormsBaseInput: (props: any) => {
        missionFormsBaseInputMock(props);

        return <div data-testid="forms-input" />;
    },
}));

vi.mock(
    'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions',
    () => ({
        useGetOrgUnitTypesDropdownOptions: () => ({
            data: [
                {
                    value: '12',
                    label: 'Clinic',
                },
            ],
            isLoading: false,
        }),
    }),
);

const createFormik = <T,>(values?: T): FormikProps<T> =>
    ({
        values: values,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValidating: false,
        submitCount: 0,
        setFieldValue: vi.fn(),
        setFieldTouched: vi.fn(),
    }) as unknown as FormikProps<T>;

type MissionOrgUnitValues =
    | MissionOrgUnitTypeCreateRequest
    | MissionOrgUnitTypeUpdateRequest;

describe('MissionOrgUnitTypeInput', () => {
    beforeEach(() => {
        missionFormsBaseInputMock.mockClear();
    });

    it('disables forms input when no org unit type is selected', async () => {
        const formik = createFormik<MissionOrgUnitValues>({
            name: 'test',
            // @ts-ignore
            org_unit_type: undefined,
            forms: [],
            min_cardinality: 1,
        });

        renderWithThemeAndIntlProvider(
            <MissionOrgUnitTypeInput formik={formik} />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    formSelectProps: expect.objectContaining({
                        disabled: true,
                    }),
                }),
            );
        });
    });

    it('enables forms input when an org unit type is selected', () => {
        renderWithThemeAndIntlProvider(
            <MissionOrgUnitTypeInput
                // @ts-ignore
                formik={createFormik({
                    org_unit_type: 12,
                })}
            />,
        );

        expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formSelectProps: expect.objectContaining({
                    disabled: false,
                }),
            }),
        );
    });

    it('resets forms and updates params when org unit type changes', async () => {
        const formik = createFormik({
            org_unit_type: undefined,
        });

        const { rerender } = renderWithThemeAndIntlProvider(
            // @ts-ignore
            <MissionOrgUnitTypeInput formik={formik} />,
        );

        act(() => {
            screen.getByTestId('select-input').click();
        });

        expect(formik.setFieldValue).toHaveBeenCalledWith('forms', []);
        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', false);

        rerender(
            <MissionOrgUnitTypeInput
                // @ts-ignore
                formik={createFormik({
                    org_unit_type: 12,
                })}
            />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        params: {
                            orgUnitTypeIds: 12,
                        },
                    },
                }),
            );
        });
    });

    it('passes params based on the selected org unit type', async () => {
        renderWithThemeAndIntlProvider(
            <MissionOrgUnitTypeInput
                // @ts-ignore
                formik={createFormik({
                    org_unit_type: 12,
                })}
            />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        params: {
                            orgUnitTypeIds: 12,
                        },
                    },
                }),
            );
        });
    });

    it('passes empty params when no org unit type is selected', async () => {
        renderWithThemeAndIntlProvider(
            <MissionOrgUnitTypeInput
                // @ts-ignore
                formik={createFormik({
                    org_unit_type: undefined,
                })}
            />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {},
                }),
            );
        });
    });
});
