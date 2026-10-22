import React from 'react';
import { screen, act } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
} from '../../../../tests/helpers';
import { SelectInput } from './SelectInput';

const options = [
    {
        value: 'cat',
        label: 'Cat',
    },
    {
        value: 'dog',
        label: 'Dog',
    },
];

const createProps = (overrides = {}) => ({
    label: 'Animal',
    options,
    field: {
        name: 'animal',
        value: 'cat',
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ animal: string }>> as FormikProps<{
        animal: string;
    }>,
    ...overrides,
});

describe('SelectInput', () => {
    it('renders the label', () => {
        renderWithThemeAndIntlProvider(<SelectInput {...createProps()} />);

        expect(screen.getByLabelText(/animal/i)).toBeInTheDocument();
    });

    it('renders the selected value', () => {
        renderWithThemeAndIntlProvider(<SelectInput {...createProps()} />);

        expect(screen.getByDisplayValue(/cat/i)).toBeInTheDocument();
    });

    it('updates Formik when the value changes', async () => {
        const props = createProps({
            field: {
                name: 'animal',
                value: '',
                onBlur: vi.fn(),
                onChange: vi.fn(),
            },
        });

        renderWithThemeAndIntlProvider(<SelectInput {...props} />);

        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /animal/i,
                nameOption: 'Dog',
            });
        });

        expect(props.form.setFieldTouched).toHaveBeenCalledWith('animal', true);
        expect(props.form.setFieldValue).toHaveBeenCalledWith('animal', 'dog');
    });

    it('calls the provided onChange', async () => {
        const onChange = vi.fn();

        const props = createProps({
            onChange,
            field: {
                name: 'animal',
                value: '',
                onBlur: vi.fn(),
                onChange: vi.fn(),
            },
        });

        renderWithThemeAndIntlProvider(<SelectInput {...props} />);

        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /animal/i,
                nameOption: 'Dog',
            });
        });

        expect(onChange).toHaveBeenCalledWith('animal', 'dog');
    });

    it('shows validation errors when touched', () => {
        renderWithThemeAndIntlProvider(
            <SelectInput
                {...createProps({
                    form: {
                        errors: { animal: 'Required' },
                        touched: { animal: true },
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    } as Partial<
                        FormikProps<{ animal: string }>
                    > as FormikProps<{ animal: string }>,
                })}
            />,
        );

        expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('does not show validation errors when not touched', () => {
        renderWithThemeAndIntlProvider(
            <SelectInput
                {...createProps({
                    form: {
                        errors: { animal: 'Required' },
                        touched: {},
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    } as Partial<
                        FormikProps<{ animal: string }>
                    > as FormikProps<{ animal: string }>,
                })}
            />,
        );

        expect(screen.queryByText('Required')).not.toBeInTheDocument();
    });
});
