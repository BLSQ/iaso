import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';

import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import MESSAGES from 'Iaso/domains/instances/messages';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
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

const { mockCurrentAccount } = vi.hoisted(() => {
    return { mockCurrentAccount: vi.fn() };
});

vi.mock('Iaso/domains/accounts/hooks', () => ({
    useCurrentAccount: mockCurrentAccount,
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
            is_superuser: true,
        });

        mockCurrentAccount.mockReturnValue({
            modules: [VALIDATION_WORKFLOW_MODULE],
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

    it('no module state is accessible', async () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            is_superuser: true,
        });

        mockCurrentAccount.mockReturnValue({
            modules: [],
        });

        const { container } = renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        expect(
            screen.getByText(MESSAGES.moduleDisabled.defaultMessage),
        ).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('no permissions state is accessible', async () => {
        mockCurrentUser.mockReturnValue({
            id: 1,
            is_superuser: false,
        });

        mockCurrentAccount.mockReturnValue({
            modules: [VALIDATION_WORKFLOW_MODULE],
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
            permissions: [VALIDATION_WORKFLOWS, SUBMISSIONS],
        });

        mockCurrentAccount.mockReturnValue({
            modules: [VALIDATION_WORKFLOW_MODULE],
        });

        (useGetSubmissionValidationStatus as any).mockReturnValue({
            data: { foo: 'bar' },
            isLoading: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <InstanceValidationWidgetPaper {...baseProps} />,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
