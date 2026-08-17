import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { FormikProps } from 'formik';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
    MissionEntityTypeCreateRequest,
    MissionEntityTypeUpdateRequest,
} from 'Iaso/api/missions';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MissionEntityTypeInput } from './MissionEntityTypeInput';

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
            onClick={() => props.onChange('entity_type', 12)}
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

vi.mock('Iaso/domains/entities/hooks/requests', () => ({
    useGetEntityTypesDropdown: () => ({
        data: [
            {
                value: '12',
                label: 'Clinic',
            },
        ],
        isLoading: false,
    }),
}));

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

type MissionEntityTypeValues =
    | MissionEntityTypeCreateRequest
    | MissionEntityTypeUpdateRequest;

describe('MissionEntityTypeInput', () => {
    beforeEach(() => {
        missionFormsBaseInputMock.mockClear();
    });

    it('disables forms input when no entity type is selected', () => {
        const formik = createFormik<MissionEntityTypeValues>({
            name: 'test',
            // @ts-ignore
            entity_type: undefined,
            forms: [],
            min_cardinality: 1,
        });

        renderWithThemeAndIntlProvider(
            <MissionEntityTypeInput formik={formik} />,
        );

        expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formSelectProps: expect.objectContaining({
                    disabled: true,
                }),
            }),
        );
    });

    it('enables forms input when an entity type is selected', () => {
        renderWithThemeAndIntlProvider(
            <MissionEntityTypeInput
                // @ts-ignore
                formik={createFormik({
                    entity_type: 12,
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

    it('resets forms and updates params when entity type changes', async () => {
        const formik = createFormik({
            entity_type: undefined,
        });

        const { rerender } = renderWithThemeAndIntlProvider(
            // @ts-ignore
            <MissionEntityTypeInput formik={formik} />,
        );

        act(() => {
            screen.getByTestId('select-input').click();
        });

        expect(formik.setFieldValue).toHaveBeenCalledWith('forms', []);
        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', false);

        rerender(
            <MissionEntityTypeInput
                // @ts-ignore
                formik={createFormik({
                    entity_type: 12,
                })}
            />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        params: {
                            entity_type_ids: 12,
                        },
                    },
                }),
            );
        });
    });

    it('passes params based on the selected entity type', async () => {
        renderWithThemeAndIntlProvider(
            <MissionEntityTypeInput
                // @ts-ignore
                formik={createFormik({
                    entity_type: 12,
                })}
            />,
        );

        await waitFor(() => {
            expect(missionFormsBaseInputMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        params: {
                            entity_type_ids: 12,
                        },
                    },
                }),
            );
        });
    });

    it('passes empty params when no entity type is selected', async () => {
        renderWithThemeAndIntlProvider(
            <MissionEntityTypeInput
                // @ts-ignore
                formik={createFormik({
                    entity_type: undefined,
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
