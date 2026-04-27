import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BooleanInput } from './BooleanInput';

describe('BooleanInput', () => {
    it('renders with label', () => {
        render(<BooleanInput label="Accept terms" />);

        expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('is unchecked by default', () => {
        render(<BooleanInput label="Accept terms" />);

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it('uses field.value when provided', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={{ name: 'terms', value: true }}
            />,
        );

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('calls provided onChange when clicked', () => {
        const handleChange = vi.fn();

        render(<BooleanInput label="Accept terms" onChange={handleChange} />);

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(handleChange).toHaveBeenCalled();
    });

    it('falls back to field.onChange if onChange not provided', () => {
        const fieldOnChange = vi.fn();

        render(
            <BooleanInput
                label="Accept terms"
                field={{ name: 'terms', value: false, onChange: fieldOnChange }}
            />,
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(fieldOnChange).toHaveBeenCalled();
    });

    it('sets id based on field.name', () => {
        render(
            <BooleanInput
                label="Accept terms"
                field={{ name: 'terms', value: false }}
            />,
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.closest('label')).toHaveAttribute(
            'id',
            'check-box-terms',
        );
    });
});
