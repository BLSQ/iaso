import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { SubmissionAccordion } from './SubmissionAccordion';

// Mock SubmissionList
vi.mock(
    'Iaso/domains/instances/components/ValidationWorkflow/timeline/SubmissionList',
    () => ({
        SubmissionList: ({ totalSteps, isMostRecent }: any) => (
            <div data-testid="submission-list">
                SubmissionList - totalSteps: {totalSteps} - mostRecent:{' '}
                {String(isMostRecent)}
            </div>
        ),
    }),
);

describe('SubmissionAccordion', () => {
    const baseSubmission = {
        general_validation_status: 'APPROVED',
        active_steps: 2,
        timeline: [],
        created_by: 'john doe',
        created_at: '2024-01-01 00:00:00',
    };

    const defaultProps = {
        totalSteps: 4,
        submission: baseSubmission,
        order: 1,
        isMostRecent: false,
        createdAt: '2024-01-01T10:00:00Z',
        createdBy: 'John Doe',
        instanceId: 123,
    };

    it('renders submission order', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(screen.getByText('Submission 1')).toBeInTheDocument();
    });

    it('renders formatted created by text', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(
            screen.getByText(/By John Doe on 2024-01-01 11:00:00/i),
        ).toBeInTheDocument();
    });

    it('renders approved status text', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders rejected status text', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...defaultProps}
                submission={{
                    ...baseSubmission,
                    general_validation_status: 'REJECTED',
                }}
            />,
        );

        expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders pending status text', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...defaultProps}
                submission={{
                    ...baseSubmission,
                    general_validation_status: 'PENDING',
                }}
            />,
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders Drafts icon when submission is most recent', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} isMostRecent={true} />,
        );

        expect(screen.getByTestId('DraftsIcon')).toBeInTheDocument();
    });

    it('renders Email icon when submission is not most recent', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} isMostRecent={false} />,
        );

        expect(screen.getByTestId('EmailIcon')).toBeInTheDocument();
    });

    it('renders expand icon', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
    });

    it('renders progressbar with correct aria-label', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(
            screen.getByRole('progressbar', {
                name: 'Progress',
            }),
        ).toBeInTheDocument();
    });

    it('renders SubmissionList component', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} />,
        );

        expect(screen.getByTestId('submission-list')).toBeInTheDocument();
    });

    it('passes correct props to SubmissionList', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...defaultProps}
                totalSteps={7}
                isMostRecent={true}
            />,
        );

        expect(
            screen.getByText(
                /SubmissionList - totalSteps: 7 - mostRecent: true/i,
            ),
        ).toBeInTheDocument();
    });

    it('sets progressbar value correctly', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion
                {...defaultProps}
                totalSteps={4}
                submission={{
                    ...baseSubmission,
                    active_steps: 2,
                }}
            />,
        );

        const progressbar = screen.getByRole('progressbar');

        expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('accordion is expanded by default when most recent', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionAccordion {...defaultProps} isMostRecent={true} />,
        );

        expect(screen.getByTestId('submission-list')).toBeVisible();
    });
});
