import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { StatusChip } from 'Iaso/domains/validationWorkflowInstances/components/StatusChip';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';

describe('StatusChip accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <StatusChip status="APPROVED" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
