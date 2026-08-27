import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import {
    mockResubmitWorkflow,
    mockWorkflow,
    mockWorkflowEmptyBypassSlug,
} from '../../testFixtures';
import { ApprovalForm } from './ApprovalForm';

const {
    mockUseParamsObject,
    mockValidateStep,
    mockRedirectTo,
    mockValidateNodeState,
} = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockValidateStep: vi.fn(),
    mockRedirectTo: vi.fn(),
    mockValidateNodeState: { isLoading: false },
}));

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('../../hooks/api', () => ({
    useValidateNode: () => ({
        mutateAsync: mockValidateStep,
        isLoading: mockValidateNodeState.isLoading,
    }),
}));

vi.mock('Iaso/components/forms/InputComponent', () => ({
    default: ({
        keyValue,
        onChange,
        disabled,
        labelString,
        helperText,
    }: {
        keyValue: string;
        onChange: (k: string, v: string) => void;
        disabled?: boolean;
        labelString?: string;
        helperText?: string;
    }) => (
        <label htmlFor={`input-${keyValue}`}>
            {labelString}
            <textarea
                id={`input-${keyValue}`}
                data-testid={`input-${keyValue}`}
                disabled={disabled}
                onChange={event => onChange(keyValue, event.target.value)}
            />
            {helperText && <span>{helperText}</span>}
        </label>
    ),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
        useRedirectTo: () => mockRedirectTo,
    };
});

describe('ApprovalForm', () => {
    const baseParams = {
        accountId: '1',
        instanceId: '42',
        selectedStep: '1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockValidateNodeState.isLoading = false;
        mockUseParamsObject.mockReturnValue(baseParams);
        mockValidateStep.mockResolvedValue({});
    });

    it('disables approve, reject, and comment when workflow is loading', () => {
        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });

    it('disables approve, reject, and comment when selectedStep is missing', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: undefined,
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });

    it('disables approve, reject, and comment for unknown selectedStep', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '999',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });

    it('disables approve, reject, and comment for non-active timeline step', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '3',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });

    it('disables approve, reject, and comment on bypass step with empty slug', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '2',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm
                workflow={mockWorkflowEmptyBypassSlug}
                isLoadingWorkflow={false}
            />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });

    it('enables approve but not reject without comment on expected next step', () => {
        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(
            screen.getByText('Add comment to enable rejection'),
        ).toBeInTheDocument();
    });

    it('enables reject when comment is provided', async () => {
        const user = userEvent.setup();

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        await user.type(screen.getByTestId('input-comment'), 'Not good');

        expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled();
    });

    it('calls validateStep with approved true on expected next step approve', async () => {
        const user = userEvent.setup();

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        await user.click(screen.getByRole('button', { name: 'Approve' }));

        expect(mockValidateStep).toHaveBeenCalledWith({
            instanceId: '42',
            nodeId: '1',
            comment: '',
            node: undefined,
            approved: true,
        });
        expect(mockRedirectTo).toHaveBeenCalled();
    });

    it('calls validateStep with node slug on bypass approve', async () => {
        const user = userEvent.setup();
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '2',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        await user.click(screen.getByRole('button', { name: 'Approve' }));

        expect(mockValidateStep).toHaveBeenCalledWith({
            instanceId: '42',
            nodeId: '2',
            comment: '',
            node: 'step-b',
            approved: true,
        });
    });

    it('uses last active step as normal path on resubmit timeline', async () => {
        const user = userEvent.setup();
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            instanceId: '42',
            selectedStep: '185',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm
                workflow={mockResubmitWorkflow}
                isLoadingWorkflow={false}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Approve' }));

        expect(mockValidateStep).toHaveBeenCalledWith({
            instanceId: '42',
            nodeId: '185',
            comment: '',
            node: undefined,
            approved: true,
        });
    });

    it('treats non-expected active step as bypass on resubmit timeline', async () => {
        const user = userEvent.setup();
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            instanceId: '42',
            selectedStep: '20',
        });

        renderWithThemeAndIntlProvider(
            <ApprovalForm
                workflow={mockResubmitWorkflow}
                isLoadingWorkflow={false}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Approve' }));

        expect(mockValidateStep).toHaveBeenCalledWith({
            instanceId: '42',
            nodeId: '20',
            comment: '',
            node: 'zone',
            approved: true,
        });
    });

    it('calls validateStep with approved false on reject', async () => {
        const user = userEvent.setup();

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        await user.type(screen.getByTestId('input-comment'), 'Rejected');
        await user.click(screen.getByRole('button', { name: 'Reject' }));

        expect(mockValidateStep).toHaveBeenCalledWith({
            instanceId: '42',
            nodeId: '1',
            comment: 'Rejected',
            node: undefined,
            approved: false,
        });
        expect(mockRedirectTo).toHaveBeenCalled();
    });

    it('does not redirect when mutation rejects', async () => {
        const user = userEvent.setup();
        mockValidateStep.mockRejectedValue(new Error('API error'));

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        await user.click(screen.getByRole('button', { name: 'Approve' }));

        expect(mockRedirectTo).not.toHaveBeenCalled();
    });

    it('disables buttons while mutation is loading', () => {
        mockValidateNodeState.isLoading = true;

        renderWithThemeAndIntlProvider(
            <ApprovalForm workflow={mockWorkflow} isLoadingWorkflow={false} />,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
        expect(screen.getByTestId('input-comment')).toBeDisabled();
    });
});
