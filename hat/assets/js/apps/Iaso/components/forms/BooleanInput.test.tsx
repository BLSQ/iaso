import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BooleanInput } from './BooleanInput';
const defaultField = {
    name: 'terms',
    value: false,
    onChange: vi.fn(),
    onBlur: vi.fn(),
} as const;

describe('BooleanInput', () => {
    it('renders with label', () => {
        render(<BooleanInput label="Accept terms" field={defaultField} />);

        expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('is unchecked by default', () => {
        render(<BooleanInput label="Accept terms" field={defaultField} />);

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it('uses field.value when provided', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={{ ...defaultField, value: true }}
            />,
        );

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('calls provided onChange when clicked', () => {
        const handleChange = vi.fn();

        render(
            <BooleanInput
                label="Accept terms"
                onChange={handleChange}
                field={defaultField}
            />,
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(handleChange).toHaveBeenCalled();
    });

    it('falls back to field.onChange if onChange not provided', () => {
        const fieldOnChange = vi.fn();

        render(
            <BooleanInput
                label="Accept terms"
                field={{ ...defaultField, onChange: fieldOnChange }}
            />,
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(fieldOnChange).toHaveBeenCalled();
    });

    it('sets id based on field.name', () => {
        render(<BooleanInput label="Accept terms" field={defaultField} />);

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.closest('label')).toHaveAttribute(
            'id',
            'check-box-terms',
        );
    });

    it('renders an error message when field is touched and has an error', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={defaultField}
                form={
                    {
                        touched: {
                            terms: true,
                        },
                        errors: {
                            terms: 'Terms must be accepted',
                        },
                    } as any
                }
            />,
        );

        expect(screen.getByText('Terms must be accepted')).toBeInTheDocument();
    });
    it('does not render an error when field has not been touched', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={defaultField}
                form={
                    {
                        touched: {},
                        errors: {
                            terms: 'Terms must be accepted',
                        },
                    } as any
                }
            />,
        );

        expect(
            screen.queryByText('Terms must be accepted'),
        ).not.toBeInTheDocument();
    });
    it('does not render an error when field has no error', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={defaultField}
                form={
                    {
                        touched: {
                            terms: true,
                        },
                        errors: {},
                    } as any
                }
            />,
        );

        expect(
            screen.queryByText(/terms must be accepted/i),
        ).not.toBeInTheDocument();
    });
});
