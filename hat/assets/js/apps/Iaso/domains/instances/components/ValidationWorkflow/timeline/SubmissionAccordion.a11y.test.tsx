import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { SubmissionAccordion } from './SubmissionAccordion';

describe('SubmissionAccordion accessibility', () => {
    const baseProps = {
        totalSteps: 4,
        order: 1,
        createdAt: '2024-01-01T10:00:00Z',
        createdBy: 'John Doe',
        instanceId: 123,
    };

    const statuses = ['APPROVED', 'REJECTED', 'PENDING'] as const;
    const recencyStates = [true, false];

    statuses.forEach(status => {
        recencyStates.forEach(isMostRecent => {
            it(`has no accessibility violations for ${status} submission (mostRecent=${isMostRecent})`, async () => {
                const { container } = renderWithThemeAndIntlProvider(
                    <SubmissionAccordion
                        {...baseProps}
                        isMostRecent={isMostRecent}
                        submission={{
                            general_validation_status: status,
                            active_steps: 2,
                            timeline: [],
                        }}
                    />,
                );

                const results = await axe(container);

                expect(results).toHaveNoViolations();
            });
        });
    });

    it('has no accessibility violations with 0 progress', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...baseProps}
                isMostRecent={false}
                submission={{
                    general_validation_status: 'PENDING',
                    active_steps: 0,
                    timeline: [],
                }}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with full progress', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...baseProps}
                isMostRecent={true}
                submission={{
                    general_validation_status: 'APPROVED',
                    active_steps: 4,
                    timeline: [],
                }}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
