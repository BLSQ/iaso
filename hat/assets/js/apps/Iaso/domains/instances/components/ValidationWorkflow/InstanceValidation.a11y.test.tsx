import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, vi, expect } from 'vitest';
import { InstanceValidation } from './InstanceValidation';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) => msg.defaultMessage || msg.id,
        }),
    };
});

vi.mock('./useGetSubmissionValidationStatus', () => ({
    useGetNodesList: () => ({ data: [] }),
}));

vi.mock('./useValidationTimeline', () => ({
    useValidationTimeline: () => [
        {
            label: 'Step 1',
            status: 'APPROVED',
            color: '#ebebeb',
            slug: 's1',
            nodeId: 1,
            canValidate: false,
            content: { description: 'desc' },
        },
    ],
}));

describe('InstanceValidation accessibility', () => {
    it('has no accessibility violations when no stepper', async () => {
        const { container } = render(
            <InstanceValidation data={{ history: [{}] } as any} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations with timeline', async () => {
        const { container } = render(
            <InstanceValidation data={{ history: [{}] } as any} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
