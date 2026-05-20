import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import { SUBMISSION_VALIDATION_WORKFLOW } from 'Iaso/utils/featureFlags';
import { SUBMISSIONS, VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import MESSAGES from '../../messages';
import { InstanceValidationWidgetPaper } from './InstanceValidationWidgetPaper';

vi.mock(
    'Iaso/domains/instances/components/ValidationWorkflow/InstanceValidation',
    () => ({
        InstanceValidation: ({ instanceId }: any) => (
            <div data-testid="instance-validation">Instance {instanceId}</div>
        ),
    }),
);

const { mockUseGetSubmissionValidationStatus } = vi.hoisted(() => {
    return { mockUseGetSubmissionValidationStatus: vi.fn() };
});

vi.mock(
    'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus',
    () => ({
        useGetSubmissionValidationStatus: mockUseGetSubmissionValidationStatus,
    }),
);

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

describe('InstanceValidationWidgetPaper', () => {
    const baseProps = {
        currentInstanceId: 42,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGetSubmissionValidationStatus as any).mockReturnValue({
            data: null,
            isLoading: false,
        });
    });

    // to be done with msw once orval is set up
    it.todo(
        'does not call API when permissions and/or feature flag is missing',
    );

    it('shows feature disabled alert when feature flag is missing', () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [],
            },
            is_superuser: true,
        });

        renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(
            screen.getByText(MESSAGES.featureDisabled.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('shows missing permissions warning when user lacks permissions', () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
            is_superuser: false,
        });

        renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(
            screen.getByText(
                MESSAGES.missingPermissions.defaultMessage.replace(
                    '{permissions}',
                    '',
                ),
                { exact: false },
            ),
        ).toBeInTheDocument();
    });

    it('does not show missing permissions if user is superuser', () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
            is_superuser: true,
        });

        renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(
            screen.queryByText(
                MESSAGES.missingPermissions.defaultMessage.replace(
                    '{permissions}',
                    '',
                ),
                { exact: false },
            ),
        ).not.toBeInTheDocument();
    });

    it('shows loading spinner when data is loading', async () => {
        (useGetSubmissionValidationStatus as any).mockReturnValue({
            data: null,
            isLoading: true,
        });
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
            is_superuser: true,
        });

        renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    it('renders InstanceValidation when everything is valid', () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
            permissions: [VALIDATION_WORKFLOWS, SUBMISSIONS],
        });
        (useGetSubmissionValidationStatus as any).mockReturnValue({
            data: { foo: 'bar' },
            isLoading: false,
        });

        renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(screen.getByTestId('instance-validation')).toBeInTheDocument();
    });
});
