import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Formik } from 'formik';
import type { FormikProps } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MissionFormItem } from './MissionFormItem';

const remove = vi.fn();

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
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

const createFormik = (): FormikProps<any> =>
    ({
        setFieldTouched: vi.fn(),
    }) as unknown as FormikProps<any>;

const renderMissionFormItem = (
    formik: FormikProps<any>,
    index: number,
    form: { form: number; min_cardinality: number; max_cardinality?: null },
) =>
    renderWithThemeAndIntlProvider(
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
                        formik={formik}
                    />
                </tbody>
            </table>
        </Formik>,
    );

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
