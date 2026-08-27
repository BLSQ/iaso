import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import MESSAGES from '../../messages';
import { mockWorkflow } from '../../testFixtures';
import { ValidationPaper } from './ValidationPaper';

const {
    mockUseParamsObject,
    mockUseGetSubmissionValidationStatus,
    captureStepInfoProps,
    captureApprovalFormProps,
} = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockUseGetSubmissionValidationStatus: vi.fn(),
    captureStepInfoProps: vi.fn(),
    captureApprovalFormProps: vi.fn(),
}));

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock(
    'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus',
    () => ({
        useGetSubmissionValidationStatus: mockUseGetSubmissionValidationStatus,
    }),
);

vi.mock('./StepInfo', () => ({
    StepInfo: (props: Record<string, unknown>) => {
        captureStepInfoProps(props);
        return <div data-testid="step-info" />;
    },
}));

vi.mock('./ApprovalForm', () => ({
    ApprovalForm: (props: Record<string, unknown>) => {
        captureApprovalFormProps(props);
        return <div data-testid="approval-form" />;
    },
}));

vi.mock('Iaso/components/papers/WidgetPaperComponent', () => ({
    default: ({
        title,
        children,
    }: {
        title: string;
        children: React.ReactNode;
    }) => (
        <div data-testid="widget-paper">
            <h2>{title}</h2>
            {children}
        </div>
    ),
}));

describe('ValidationPaper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            instanceId: '42',
        });
        mockUseGetSubmissionValidationStatus.mockReturnValue({
            data: mockWorkflow,
            isLoading: false,
        });
    });

    it('renders validation title', () => {
        renderWithThemeAndIntlProvider(
            <ValidationPaper formName="Test Form" />,
        );

        expect(
            screen.getByText(MESSAGES.validation.defaultMessage),
        ).toBeInTheDocument();
    });

    it('passes workflow and loading state to StepInfo', () => {
        mockUseGetSubmissionValidationStatus.mockReturnValue({
            data: mockWorkflow,
            isLoading: true,
        });

        renderWithThemeAndIntlProvider(
            <ValidationPaper formName="Test Form" />,
        );

        expect(captureStepInfoProps).toHaveBeenCalledWith(
            expect.objectContaining({
                formName: 'Test Form',
                workflow: mockWorkflow,
                isLoading: true,
            }),
        );
    });

    it('passes workflow and loading state to ApprovalForm', () => {
        mockUseGetSubmissionValidationStatus.mockReturnValue({
            data: mockWorkflow,
            isLoading: true,
        });

        renderWithThemeAndIntlProvider(
            <ValidationPaper formName="Test Form" />,
        );

        expect(captureApprovalFormProps).toHaveBeenCalledWith(
            expect.objectContaining({
                workflow: mockWorkflow,
                isLoadingWorkflow: true,
            }),
        );
    });

    it('fetches workflow status for instance id from params', () => {
        renderWithThemeAndIntlProvider(
            <ValidationPaper formName="Test Form" />,
        );

        expect(useGetSubmissionValidationStatus).toHaveBeenCalledWith(42);
    });
});
