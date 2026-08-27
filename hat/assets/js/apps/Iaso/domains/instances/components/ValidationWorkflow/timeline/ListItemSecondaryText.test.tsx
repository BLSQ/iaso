import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { ListItemSecondaryText } from './ListItemSecondaryText';

const mockRedirectTo = vi.fn();

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
    };
});

// Mock modal components
vi.mock(
    'Iaso/domains/instances/components/ValidationWorkflow/ValidationModal',
    () => ({
        ValidateNodeApproveModal: ({ iconProps }: any) => (
            <button>{iconProps.buttonText}</button>
        ),
        ValidateNodeRejectModal: ({ iconProps }: any) => (
            <button>{iconProps.buttonText}</button>
        ),
        ValidateNodeApproveByPassModal: ({ iconProps }: any) => (
            <button>{iconProps.buttonText}</button>
        ),
        ValidateNodeRejectByPassModal: ({ iconProps }: any) => (
            <button>{iconProps.buttonText}</button>
        ),
    }),
);

describe('ListItemSecondaryText', () => {
    const baseTimelineItem = {
        id: 1,
        status: 'ACCEPTED',
        updated_by: 'John Doe',
        updated_at: '2024-01-01T10:00:00',
        comment: 'Looks good',
        user_can_do_actions: false,
        node_template_slug: 'node-slug',
        order: 1,
        name: 'Node 1',
        created_at: '2024-01-01T09:00:00',
    };

    it('renders nothing if type is NEXT_STEP', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'NEXT_STEP',
                    status: 'UNKNOWN',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );
        expect(container.innerHTML).toBe('');
    });

    it("renders nothing if type is NEXT_BYPASS and user can't do action", () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'NEXT_BYPASS',
                    user_can_do_actions: false,
                    status: 'UNKNOWN',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders pending text for UNKNOWN item', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'UNKNOWN',
                }}
                isFirstSubmission
                instanceId={123}
            />,
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders approve and reject buttons for actionable UNKNOWN item', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'UNKNOWN',
                    user_can_do_actions: true,
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Approve' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Reject' }),
        ).toBeInTheDocument();
    });

    it('renders bypass approve and reject buttons for NEXT_BYPASS item', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'NEXT_BYPASS',
                    status: 'UNKNOWN',
                    user_can_do_actions: true,
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Approve' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Reject' }),
        ).toBeInTheDocument();
    });

    it('renders skipped text when status is SKIPPED', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'SKIPPED',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(screen.getByText('Skipped')).toBeInTheDocument();
    });

    it('renders validation info with user and formatted date', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'APPROVED',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(
            screen.getByText(/By John Doe on 2024-01-01 10:00:00/i),
        ).toBeInTheDocument();
    });

    it('renders comment when present', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'REJECTED',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(screen.getByText(/Comment/i)).toBeInTheDocument();

        expect(screen.getByText(/Looks good/i)).toBeInTheDocument();
    });

    it('does not render comment when absent', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'ACCEPTED',
                    comment: '',
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(screen.queryByText(/Comment:/i)).not.toBeInTheDocument();
    });

    it('does not render action buttons when user cannot do actions', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'UNKNOWN',
                    user_can_do_actions: false,
                }}
                instanceId={123}
                isFirstSubmission
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Approve' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Reject' }),
        ).not.toBeInTheDocument();
    });
});
