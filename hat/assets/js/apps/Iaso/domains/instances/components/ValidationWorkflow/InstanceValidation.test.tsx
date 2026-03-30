import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
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

        StepLabel: ({ children, StepIconProps }: any) => (
            <div data-testid="step-label" data-color={StepIconProps?.sx?.color}>
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

    const timeline = [
        {
            label: 'Step 1',
            status: 'APPROVED',
            color: '#bbbbbb',
            slug: 'step-1',
            nodeId: 1,
            canValidate: false,
            content: { description: 'desc 1' },
        },
        {
            label: 'Step 2',
            status: 'REJECTED',
            color: '#ffffff',
            slug: 'step-2',
            nodeId: 2,
            canValidate: true,
            content: {
                comment: 'comment',
                author: 'author',
                date: '2023-01-01',
            },
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
        expect(screen.getAllByTestId('step')).toHaveLength(2);
    });

    it('renders timeline content correctly', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        expect(screen.getByText('desc 1')).toBeInTheDocument();
        expect(screen.getByText('comment')).toBeInTheDocument();
        expect(screen.getByText('author')).toBeInTheDocument();
        expect(screen.getByText(/01-01-2023/)).toBeInTheDocument();
    });

    it('applies correct color to each step', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        const labels = screen.getAllByTestId('step-label');

        expect(labels[0]).toHaveAttribute('data-color', '#bbbbbb');
        expect(labels[1]).toHaveAttribute('data-color', '#ffffff');
    });

    it('renders validation modal only when allowed', () => {
        render(<InstanceValidation data={{ history: [{}, {}] } as any} />);

        const modals = screen.getAllByTestId('validate-modal');
        expect(modals).toHaveLength(1);
        expect(modals[0]).toHaveTextContent('step-2');
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
