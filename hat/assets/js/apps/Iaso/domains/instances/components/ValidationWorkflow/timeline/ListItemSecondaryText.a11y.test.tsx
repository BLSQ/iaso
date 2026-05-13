import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Timeline } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { ListItemSecondaryText } from './ListItemSecondaryText';

describe('ListItemSecondaryText accessibility', () => {
    const baseTimelineItem = {
        id: 1,
        type: 'TIMELINE',
        status: 'ACCEPTED',
        updated_by: 'John Doe',
        updated_at: '2024-01-01T10:00:00Z',
        comment: 'Looks good',
        user_can_do_actions: false,
        node_template_slug: 'node-slug',
    };

    it('has no accessibility violations for normal validated item with comment', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={baseTimelineItem as Timeline}
                isMostRecent={false}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for normal validated item without comment', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        comment: '',
                    } as Timeline
                }
                isMostRecent={false}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for SKIPPED item', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        status: 'SKIPPED',
                    } as Timeline
                }
                isMostRecent={false}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for UNKNOWN most recent item without actions', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        status: 'UNKNOWN',
                        user_can_do_actions: false,
                    } as Timeline
                }
                isMostRecent={true}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for UNKNOWN most recent item with actions', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        status: 'UNKNOWN',
                        user_can_do_actions: true,
                    } as Timeline
                }
                isMostRecent={true}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for NEXT_BYPASS item without actions', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        type: 'NEXT_BYPASS',
                        status: 'UNKNOWN',
                        user_can_do_actions: false,
                    } as Timeline
                }
                isMostRecent={true}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for NEXT_BYPASS item with actions', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        type: 'NEXT_BYPASS',
                        status: 'UNKNOWN',
                        user_can_do_actions: true,
                    } as Timeline
                }
                isMostRecent={true}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for non-most-recent UNKNOWN item', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ListItemSecondaryText
                timelineItem={
                    {
                        ...baseTimelineItem,
                        status: 'UNKNOWN',
                    } as Timeline
                }
                isMostRecent={false}
                instanceId={123}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
