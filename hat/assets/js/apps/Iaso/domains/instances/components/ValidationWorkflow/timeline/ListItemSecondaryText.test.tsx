import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { ListItemSecondaryText } from './ListItemSecondaryText';

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
        updated_at: '2024-01-01T10:00:00Z',
        comment: 'Looks good',
        user_can_do_actions: false,
        node_template_slug: 'node-slug',
        order: 1,
        name: 'Node 1',
        created_at: '2024-01-01T09:00:00Z',
    };

    it('renders pending text for most recent UNKNOWN item', () => {
        renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={{
                    ...baseTimelineItem,
                    type: 'TIMELINE',
                    status: 'UNKNOWN',
                }}
                isMostRecent={true}
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
                isMostRecent={true}
                instanceId={123}
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
                isMostRecent={true}
                instanceId={123}
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
                isMostRecent={false}
                instanceId={123}
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
                    status: 'UNKNOWN',
                }}
                isMostRecent={false}
                instanceId={123}
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
                    status: 'UNKNOWN',
                }}
                isMostRecent={false}
                instanceId={123}
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
                isMostRecent={false}
                instanceId={123}
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
                isMostRecent={true}
                instanceId={123}
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
