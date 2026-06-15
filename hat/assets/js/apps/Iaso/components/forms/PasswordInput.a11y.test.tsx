import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import PasswordInput from 'Iaso/components/forms/PasswordInput';

describe('PasswordInput accessibility', () => {
    it('has no accessibility violation', async () => {
        const { container } = render(<PasswordInput label={'Password'} />);

        expect(screen.getByLabelText('Password')).toBeInTheDocument();

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violation when filled in', async () => {
        const { container } = render(
            <PasswordInput
                label={'Password'}
                field={{
                    value: 'password',
                }}
            />,
        );
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toHaveValue('password');

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
