import React from 'react';
import { render, screen, within } from '@testing-library/react';
import moment from 'moment';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import { InstanceValidation } from './InstanceValidation';

vi.mock('bluesquare-components', () => ({
    useSafeIntl: () => ({
        formatMessage: () => 'Validate',
    }),
}));

vi.mock('@mui/material', async () => {
    const React = await import('react');
    return {
        Box: ({ children }: any) => <div>{children}</div>,
        Stepper: ({ children }: any) => (
            <div data-testid="stepper">{children}</div>
        ),
        Step: ({ children }: any) => <div data-testid="step">{children}</div>,

        StepLabel: ({ children, StepIconProps, icon }: any) => (
            <div data-testid="step-label" data-color={StepIconProps?.sx?.color}>
                {icon}
                {children}
            </div>
        ),

        StepContent: ({ children }: any) => (
            <div data-testid="step-content">{children}</div>
        ),

        Typography: ({ children }: any) => <div>{children}</div>,
    };
});

vi.mock('./useGetSubmissionValidationStatus', () => ({
    useGetNodesList: vi.fn(),
}));

vi.mock('./useValidationTimeline', () => ({
    useValidationTimeline: vi.fn(),
}));

vi.mock('./ValidationModal', () => ({
    ValidateNodeModal: ({ nodeSlug }: any) => (
        <div data-testid="validate-modal">{nodeSlug}</div>
    ),
}));

import { useGetNodesList } from './useGetSubmissionValidationStatus';
import { useValidationTimeline } from './useValidationTimeline';

describe('InstanceValidation (Vitest)', () => {
    const mockNodes = [{ id: 1 }];
    const date = moment(Date.now()).format(apiMobileDateFormat);
    const timeline = [
        {
            canValidate: true,
            color: '#ffffff',
            content: {
                description: 'desc2',
            },
            label: 'Node2',
            nodeId: 3,
            nodeSlug: 'node2',
            order: 2,
        },
        {
            color: '#bbbbbb',
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
            color: '#bbbbbb',
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
            color: '#ffffff',
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
            color: '#bbbbbb',
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
    ];

    beforeEach(() => {
        vi.mocked(useGetNodesList).mockReturnValue({ data: mockNodes } as any);
        vi.mocked(useValidationTimeline).mockReturnValue(timeline as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does not render stepper if no history', () => {
        const { rerender } = render(
            <InstanceValidation data={{ history: [] } as any} />,
        );
        expect(screen.queryByTestId('stepper')).not.toBeInTheDocument();
        rerender(<InstanceValidation />);
        expect(screen.queryByTestId('stepper')).not.toBeInTheDocument();
    });

    it('renders stepper and steps', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        expect(screen.getByTestId('stepper')).toBeInTheDocument();
        expect(screen.getAllByTestId('step')).toHaveLength(5);
    });

    it('renders submission and new version with a special icon', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);
        expect(screen.getAllByTestId('SendIcon')).toHaveLength(2);
    });

    it('renders timeline content correctly', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);
        const steps = screen.getAllByTestId('step');

        // step 1
        expect(within(steps[0]).queryByText('Submission')).toBeNull();
        expect(within(steps[0]).queryByText('John')).toBeNull();
        expect(within(steps[0]).getByText('Node2')).toBeInTheDocument();
        expect(within(steps[0]).getByText('desc2')).toBeInTheDocument();
        expect(
            within(steps[0]).getByText('2', { exact: true }),
        ).toBeInTheDocument();
        expect(
            within(steps[0]).queryByText(
                moment(date, apiMobileDateFormat).format('DD-MM-YYYY HH:mm:ss'),
            ),
        ).toBeNull();
        expect(within(steps[0]).queryByTestId('SendIcon')).toBeNull();

        // step 2
        expect(within(steps[1]).queryByText('Submission')).toBeNull();
        expect(within(steps[1]).getByText('John')).toBeInTheDocument();
        expect(within(steps[1]).getByText('ok')).toBeInTheDocument();
        expect(within(steps[1]).getByText('Node1')).toBeInTheDocument();
        expect(
            within(steps[1]).getByText('1', { exact: true }),
        ).toBeInTheDocument();
        expect(
            within(steps[1]).getByText(
                moment(date, apiMobileDateFormat).format('DD-MM-YYYY HH:mm:ss'),
            ),
        ).toBeInTheDocument();
        expect(within(steps[1]).queryByTestId('SendIcon')).toBeNull();

        // step 3
        expect(within(steps[2]).getByText('New version')).toBeInTheDocument();
        expect(within(steps[2]).getByText('John')).toBeInTheDocument();
        expect(
            within(steps[2]).getByText(
                moment(date, apiMobileDateFormat).format('DD-MM-YYYY HH:mm:ss'),
            ),
        ).toBeInTheDocument();
        expect(within(steps[2]).getByTestId('SendIcon')).toBeInTheDocument();

        // step 4
        expect(within(steps[3]).queryByText('Submission')).toBeNull();
        expect(within(steps[3]).getByText('John')).toBeInTheDocument();
        expect(within(steps[3]).getByText('Nope')).toBeInTheDocument();
        expect(within(steps[3]).getByText('Node2')).toBeInTheDocument();
        expect(
            within(steps[3]).getByText('2', { exact: true }),
        ).toBeInTheDocument();
        expect(
            within(steps[3]).getByText(
                moment(date, apiMobileDateFormat).format('DD-MM-YYYY HH:mm:ss'),
            ),
        ).toBeInTheDocument();
        expect(within(steps[3]).queryByTestId('SendIcon')).toBeNull();

        // step 5
        expect(within(steps[4]).getByText('Submission')).toBeInTheDocument();
        expect(within(steps[4]).getByText('John')).toBeInTheDocument();
        expect(
            within(steps[4]).getByText(
                moment(date, apiMobileDateFormat).format('DD-MM-YYYY HH:mm:ss'),
            ),
        ).toBeInTheDocument();
        expect(within(steps[4]).getByTestId('SendIcon')).toBeInTheDocument();
    });

    it('applies correct color to each step', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        const labels = screen.getAllByTestId('step-label');

        expect(labels[1]).toHaveAttribute('data-color', '#bbbbbb');
        expect(labels[0]).toHaveAttribute('data-color', '#ffffff');
    });

    it('renders validation modal only when allowed', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        const modals = screen.getAllByTestId('validate-modal');
        expect(modals).toHaveLength(1);
        expect(modals[0]).toHaveTextContent('node2');
    });

    it('calls hooks with correct args', () => {
        const data = { workflow: 'wf', history: [{}] };

        render(<InstanceValidation data={data as any} />);

        expect(useGetNodesList).toHaveBeenCalledWith('wf');
        expect(useValidationTimeline).toHaveBeenCalledWith({
            data,
            nodes: mockNodes,
        });
    });
});
