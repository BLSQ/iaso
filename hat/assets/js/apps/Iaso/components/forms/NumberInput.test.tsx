import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { FormikProps } from 'formik';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';

const createProps = (overrides = {}) => ({
    label: 'Age',
    field: {
        name: 'age',
        value: 12,
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ age: number }>> as FormikProps<{
        age: number;
    }>,
    ...overrides,
});

describe('NumberInput', () => {
    it('renders the label and value', () => {
        renderWithThemeAndIntlProvider(<NumberInput {...createProps()} />);

        expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    });

    it('renders an input', () => {
        renderWithThemeAndIntlProvider(<NumberInput {...createProps()} />);

        const input = screen.getByLabelText(/age/i) as HTMLInputElement;

        expect(input).toHaveAttribute('type', 'text');
    });

    it('calls Formik setters when the value changes', () => {
        const props = createProps();

        renderWithThemeAndIntlProvider(<NumberInput {...props} />);

        const input = screen.getByLabelText(/age/i) as HTMLInputElement;

        fireEvent.change(input, {
            target: { value: '42' },
        });

        expect(props.form.setFieldTouched).toHaveBeenCalledWith('age', true);
        expect(props.form.setFieldValue).toHaveBeenCalledWith('age', 42);
    });

    it('calls the provided onChange', () => {
        const onChange = vi.fn();
        const props = createProps({ onChange });

        renderWithThemeAndIntlProvider(<NumberInput {...props} />);

        const input = screen.getByLabelText(/age/i) as HTMLInputElement;

        fireEvent.change(input, {
            target: { value: '99' },
        });

        expect(onChange).toHaveBeenCalledWith('age', 99);
    });

    it('shows validation errors when the field is touched', () => {
        renderWithThemeAndIntlProvider(
            <NumberInput
                {...createProps({
                    form: {
                        errors: { age: 'Required' },
                        touched: { age: true },
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    },
                })}
            />,
        );

        expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('does not show validation errors if the field is not touched', () => {
        renderWithThemeAndIntlProvider(
            <NumberInput
                {...createProps({
                    form: {
                        errors: { age: 'Required' },
                        touched: {},
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    },
                })}
            />,
        );

        expect(screen.queryByText('Required')).not.toBeInTheDocument();
    });
});
