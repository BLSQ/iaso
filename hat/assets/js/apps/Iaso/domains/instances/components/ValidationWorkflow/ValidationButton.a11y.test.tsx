import React from 'react';
import { axe } from 'jest-axe';
import { vi } from 'vitest';
import { ValidateButton } from 'Iaso/domains/instances/components/ValidationWorkflow/ValidateButton';
import { renderWithTheme } from '../../../../../../tests/helpers';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
    };
});
describe('ValidateButton accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithTheme(
            <ValidateButton buttonText="Click Me" />,
        );
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with default text', async () => {
        const { container } = renderWithTheme(<ValidateButton />);
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
