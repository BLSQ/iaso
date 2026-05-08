import React from 'react';
import { axe } from 'jest-axe';
import moment from 'moment/moment';
import { describe, it, vi, expect } from 'vitest';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import { renderWithTheme } from '../../../../../../tests/helpers';
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

const { mockUseValidationTimeline } = vi.hoisted(() => {
    return { mockUseValidationTimeline: vi.fn() };
});

vi.mock('./useValidationTimeline', () => ({
    useValidationTimeline: mockUseValidationTimeline,
}));

describe('InstanceValidation accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('has no accessibility violations when no stepper', async () => {
        const { container } = renderWithTheme(
            <InstanceValidation data={{ history: [{}] } as any} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations with timeline', async () => {
        const date = moment(Date.now()).format(apiMobileDateFormat);
        mockUseValidationTimeline.mockReturnValue([
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'Submission',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'SUBMISSION',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: 'Nope',
                    date: date,
                    description: 'desc2',
                },
                label: 'Node2',
                nodeSlug: 'node2',
                order: 2,
                previous: true,
                status: 'REJECTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'New version',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'NEW_VERSION',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: 'ok',
                    date: date,
                    description: 'desc1',
                },
                label: 'Node1',
                nodeSlug: 'node1',
                order: 1,
                status: 'ACCEPTED',
            },
            {
                canValidate: true,
                color: '#00ff00',
                content: {
                    description: 'desc2',
                },
                label: 'Node2',
                nodeId: 3,
                nodeSlug: 'node2',
                order: 2,
            },
        ]);
        const { container } = renderWithTheme(
            <InstanceValidation data={{ history: [{}] } as any} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
