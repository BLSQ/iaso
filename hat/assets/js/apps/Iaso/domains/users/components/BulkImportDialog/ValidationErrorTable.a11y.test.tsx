import React from 'react';
import { axe } from 'jest-axe';
import { renderWithTheme } from '../../../../../../tests/helpers';
import { ValidationErrorTable } from './ValidationErrorTable';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) => msg.defaultMessage || msg.id || msg,
        }),
    };
});

// mock messages
vi.mock('../../messages', async () => {
    const actual = await vi.importActual('../../messages');
    return {
        ...actual,
        row: { id: 'row', defaultMessage: 'Row' },
        field: { id: 'field', defaultMessage: 'Field' },
        errorMessage: { id: 'errorMessage', defaultMessage: 'Error message' },
    };
});

describe('ValidationErrorTable accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithTheme(
            <ValidationErrorTable
                errors={[
                    { general: 'Global error' },
                    {
                        row: 3,
                        errors: { field1: 'Error 1' },
                    },
                ]}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
