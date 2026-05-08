import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { StatusChip } from 'Iaso/domains/validationWorkflowInstances/components/StatusChip';

describe('StatusChup accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = render(<StatusChip status="APPROVED" />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
