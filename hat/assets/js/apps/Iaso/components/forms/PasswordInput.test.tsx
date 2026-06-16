import React from 'react';
import { render, screen } from '@testing-library/react';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
    const defaultField = {
        name: 'password',
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with the provided label', () => {
        render(
            <PasswordInput label="Password" field={defaultField} form={{}} />,
        );

        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders as a password input', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: 'secret' }}
                form={{}}
            />,
        );

        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'type',
            'password',
        );
    });

    it('uses an empty string when field.value is undefined', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: undefined }}
                form={{}}
            />,
        );

        expect(screen.getByLabelText('Password')).toHaveValue('');
    });

    it('does not display the field value', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: 'my-password' }}
                form={{}}
            />,
        );

        expect(screen.getByLabelText('Password')).toHaveValue('my-password');
        expect(screen.queryByText('my-password')).toBeNull();
    });

    it('does not show an error when there are no form errors', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: 'secret' }}
                form={{
                    initialValues: { password: 'secret' },
                    errors: {},
                    touched: {},
                }}
            />,
        );

        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });

    it('shows an error when value differs from initial value and an error exists', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: 'new-password' }}
                form={{
                    initialValues: { password: 'old-password' },
                    errors: { password: 'Password is required' },
                    touched: {},
                }}
            />,
        );

        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows an error when field is touched, has an error, and value equals initial value', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: '' }}
                form={{
                    initialValues: { password: '' },
                    errors: { password: 'Password is required' },
                    touched: { password: true },
                }}
            />,
        );

        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('does not show an error when value equals initial value and field is not touched', () => {
        render(
            <PasswordInput
                label="Password"
                field={{ ...defaultField, value: '' }}
                form={{
                    initialValues: { password: '' },
                    errors: { password: 'Password is required' },
                    touched: { password: false },
                }}
            />,
        );

        expect(
            screen.queryByText('Password is required'),
        ).not.toBeInTheDocument();
    });

    it('accepts custom size and variant props', () => {
        const { container } = render(
            <PasswordInput
                label="Password"
                field={defaultField}
                form={{}}
                size="small"
                variant="filled"
            />,
        );

        const sizeClass = container.querySelector('.MuiInputLabel-sizeSmall');
        const variantClass = container.querySelector('.MuiInputLabel-filled');

        expect(sizeClass).toBeInTheDocument();
        expect(variantClass).toBeInTheDocument();
    });

    it('renders fullWidth by default', () => {
        const { container } = render(
            <PasswordInput label="Password" field={defaultField} form={{}} />,
        );

        expect(
            container.querySelector('.MuiFormControl-fullWidth'),
        ).toBeInTheDocument();
    });
});
