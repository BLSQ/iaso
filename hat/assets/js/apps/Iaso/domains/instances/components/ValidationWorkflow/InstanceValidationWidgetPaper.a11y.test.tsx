import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';

import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import MESSAGES from 'Iaso/domains/instances/messages';
import { SUBMISSION_VALIDATION_WORKFLOW } from 'Iaso/utils/featureFlags';
import { SUBMISSIONS, VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { InstanceValidationWidgetPaper } from './InstanceValidationWidgetPaper';

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

describe('InstanceValidationWidgetPaper a11y', () => {
    const baseProps = { currentInstanceId: 42 };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGetSubmissionValidationStatus as any).mockReturnValue({
            data: null,
            isLoading: false,
        });
    });

    // todo : LoadingSpinner is not accessible and not possible to add an aria-label ....
    it.skip('loading state is accessible', async () => {
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

        const { container } = renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('no feature flag state is accessible', async () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [],
            },
            is_superuser: true,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(
            screen.getByText(MESSAGES.featureDisabled.defaultMessage),
        ).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('no permissions state is accessible', async () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            account: {
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
            is_superuser: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
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

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('valid state is accessible', async () => {
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

        const { container } = renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
