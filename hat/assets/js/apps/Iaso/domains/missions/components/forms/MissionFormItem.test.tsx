import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Formik } from 'formik';
import type { FormikProps } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MissionFormItem } from './MissionFormItem';

const remove = vi.fn();
let mockFormik: FormikProps<any>;

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        useFormikContext: () => mockFormik,
        Field: (props: any) => (
            <input aria-label={props.label} data-testid={props.name} />
        ),
    };
});

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message?.defaultMessage ?? message?.id ?? '',
        }),
    };
});

const createFormik = ({
    errors = {},
    touched = {},
}: Partial<
    Pick<FormikProps<any>, 'errors' | 'touched'>
> = {}): FormikProps<any> =>
    ({
        errors,
        touched,
        setFieldTouched: vi.fn(),
    }) as unknown as FormikProps<any>;

const renderMissionFormItem = (
    formik: FormikProps<any>,
    index: number,
    form: { form: number; min_cardinality: number; max_cardinality?: null },
) => {
    mockFormik = formik;
    return renderWithThemeAndIntlProvider(
        <Formik initialValues={{ forms: [form] }} onSubmit={() => undefined}>
            <table>
                <tbody>
                    <MissionFormItem
                        form={form}
                        findFormOptionFromValue={() => ({
                            value: 1,
                            label: 'Form A',
                            original: {},
                        })}
                        index={index}
                        arrayHelpers={
                            {
                                remove,
                            } as any
                        }
                    />
                </tbody>
            </table>
        </Formik>,
    );
};

describe('MissionFormItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form label and cardinality fields', () => {
        const formik = createFormik();

        renderMissionFormItem(formik, 0, {
            form: 1,
            min_cardinality: 1,
            max_cardinality: null,
        });

        expect(screen.getByText('Form A')).toBeInTheDocument();
        expect(
            screen.getByRole('textbox', { name: /min cardinality/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('textbox', { name: /max cardinality/i }),
        ).toBeInTheDocument();
    });

    it('shows touched cardinality errors once in a row below the form', () => {
        const error = 'Minimum cardinality must be inferior';
        const formik = createFormik({
            errors: {
                forms: [{ min_cardinality: error, max_cardinality: error }],
            },
            touched: {
                forms: [{ min_cardinality: true, max_cardinality: true }],
            },
        });

        renderMissionFormItem(formik, 0, {
            form: 1,
            min_cardinality: 2,
            max_cardinality: null,
        });

        expect(screen.getAllByText(error)).toHaveLength(1);
        expect(screen.getAllByRole('row')).toHaveLength(2);
    });

    it('hides cardinality errors of untouched fields', () => {
        const formik = createFormik({
            errors: { forms: [{ min_cardinality: 'Error' }] },
        });

        renderMissionFormItem(formik, 0, {
            form: 1,
            min_cardinality: 2,
            max_cardinality: null,
        });

        expect(screen.queryByText('Error')).not.toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(1);
    });

    it('shows touched form and cardinality errors together in the row below', () => {
        const formik = createFormik({
            errors: {
                forms: [{ form: 'Form error', max_cardinality: 'Max error' }],
            },
            touched: { forms: [{ form: true, max_cardinality: true }] },
        });

        renderMissionFormItem(formik, 0, {
            form: 1,
            min_cardinality: 2,
            max_cardinality: null,
        });

        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getAllByRole('row')[1]).toHaveTextContent(
            'Form errorMax error',
        );
    });

    it('removes the form and marks forms as touched', () => {
        const formik = createFormik();

        renderMissionFormItem(formik, 2, {
            form: 1,
            min_cardinality: 1,
        });

        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(remove).toHaveBeenCalledWith(2);
        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', true);
    });
});
