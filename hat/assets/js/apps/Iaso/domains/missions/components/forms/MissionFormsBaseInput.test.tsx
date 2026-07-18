import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MissionFormsBaseInput } from './MissionFormsBaseInput';

const push = vi.fn();
const remove = vi.fn();

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        Field: () => <div data-testid="field" />,
        ErrorMessage: () => null,
        FieldArray: ({ render }: any) =>
            render({
                push,
                remove,
                form: {
                    touched: {
                        forms: true,
                    },
                },
            }),
    };
});

const selectSpy = vi.fn();

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        Select: (props: any) => {
            selectSpy(props);

            return (
                <>
                    <button
                        data-testid="select"
                        onClick={() => props.onChange(2)}
                    >
                        Select form
                    </button>

                    <div>
                        {props.options?.map((o: any) => (
                            <span key={o.value}>{o.label}</span>
                        ))}
                    </div>
                </>
            );
        },
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message?.defaultMessage ?? message?.id ?? '',
        }),
    };
});

vi.mock('Iaso/components/forms/NumberInput', () => ({
    NumberInput: () => <div data-testid="number-input" />,
}));

const formsOptions = [
    {
        value: 1,
        label: 'Form A',
    },
    {
        value: 2,
        label: 'Form B',
    },
];

const hookResult = {
    data: formsOptions,
    isLoading: false,
};

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: vi.fn(() => hookResult),
}));

const createFormik = (values?: any): FormikProps<any> =>
    ({
        values: values,
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    }) as unknown as FormikProps<any>;

describe('MissionFormsBaseInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('filters already selected forms from the available options', () => {
        renderWithThemeAndIntlProvider(
            <MissionFormsBaseInput
                formik={createFormik({
                    forms: [
                        {
                            form: 1,
                            min_cardinality: 1,
                        },
                    ],
                })}
            />,
        );

        expect(selectSpy).toHaveBeenCalled();

        const props = selectSpy.mock.calls.at(-1)?.[0];

        expect(props.options).toEqual([
            {
                value: 2,
                label: 'Form B',
            },
        ]);
    });

    it('adds a form and marks forms as touched', () => {
        const formik = createFormik({
            forms: [],
        });

        renderWithThemeAndIntlProvider(
            <MissionFormsBaseInput formik={formik} />,
        );

        fireEvent.click(screen.getByTestId('select'));

        expect(push).toHaveBeenCalledWith({
            form: 2,
            min_cardinality: 1,
            max_cardinality: null,
        });

        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', true);
    });

    it('removes a form and marks forms as touched', () => {
        const formik = createFormik({
            forms: [
                {
                    form: 1,
                    min_cardinality: 1,
                },
            ],
        });

        renderWithThemeAndIntlProvider(
            <MissionFormsBaseInput formik={formik} />,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /delete/i,
            }),
        );

        expect(remove).toHaveBeenCalledWith(0);

        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', true);
    });

    it('shows the array error when forms has a string error', () => {
        const formik = createFormik({
            forms: [],
        });

        formik.errors = {
            forms: 'Please select at least one form',
        };

        renderWithThemeAndIntlProvider(
            <MissionFormsBaseInput formik={formik} />,
        );

        expect(
            screen.getByText('Please select at least one form'),
        ).toBeInTheDocument();
    });

    it('does not show the array error when there is no error', () => {
        renderWithThemeAndIntlProvider(
            <MissionFormsBaseInput
                formik={createFormik({
                    forms: [],
                })}
            />,
        );

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
