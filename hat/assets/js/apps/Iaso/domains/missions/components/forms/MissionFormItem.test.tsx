import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
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
            <input
                aria-label={props['aria-label']}
                data-testid={props.name}
            />
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

describe('MissionFormItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form label and cardinality fields', () => {
        const formik = createFormik();

        renderWithThemeAndIntlProvider(
            <table>
                <tbody>
                    <MissionFormItem
                        form={{
                            form: 1,
                            min_cardinality: 1,
                            max_cardinality: null,
                        }}
                        findFormOptionFromValue={() => ({
                            value: 1,
                            label: 'Form A',
                            original: {},
                        })}
                        index={0}
                        arrayHelpers={
                            {
                                remove,
                            } as any
                        }
                        formik={formik}
                    />
                </tbody>
            </table>,
        );

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

        renderWithThemeAndIntlProvider(
            <table>
                <tbody>
                    <MissionFormItem
                        form={{
                            form: 1,
                            min_cardinality: 1,
                        }}
                        findFormOptionFromValue={() => ({
                            value: 1,
                            label: 'Form A',
                            original: {},
                        })}
                        index={2}
                        arrayHelpers={
                            {
                                remove,
                            } as any
                        }
                        formik={formik}
                    />
                </tbody>
            </table>,
        );

        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(remove).toHaveBeenCalledWith(2);
        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', true);
    });
});
