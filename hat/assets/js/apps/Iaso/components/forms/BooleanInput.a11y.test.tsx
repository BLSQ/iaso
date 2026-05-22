import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BooleanInput } from 'Iaso/components/forms/BooleanInput';

describe('BooleanInput accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = render(<BooleanInput label={'some label'} />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
