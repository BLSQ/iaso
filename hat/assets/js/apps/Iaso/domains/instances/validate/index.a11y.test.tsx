import React from 'react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import MESSAGES from './messages';
import { mockDiffResults } from './testFixtures';
import { ValidateInstance } from './index';

const { mockUseParamsObject, mockUseGetInstance, mockUseApiDiffInstancesList } =
    vi.hoisted(() => ({
        mockUseParamsObject: vi.fn(),
        mockUseGetInstance: vi.fn(),
        mockUseApiDiffInstancesList: vi.fn(),
    }));

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('../hooks/requests/useGetInstance', () => ({
    useGetInstance: mockUseGetInstance,
}));

vi.mock('Iaso/api/instanceDiff', () => ({
    useApiDiffInstancesList: mockUseApiDiffInstancesList,
}));

vi.mock('Iaso/components/nav/TopBarComponent', () => ({
    default: ({ title }: { title: string }) => (
        <div data-testid="top-bar">{title}</div>
    ),
}));

vi.mock('./components/ValidationPaper/ValidationPaper', () => ({
    ValidationPaper: ({ formName }: { formName: string }) => (
        <div data-testid="validation-paper">{formName}</div>
    ),
}));

vi.mock('../compare/components/InstanceLogDetail', () => ({
    InstanceLogDetail: ({
        emptyPlaceholder,
    }: {
        emptyPlaceholder?: { defaultMessage?: string };
    }) => (
        <div data-testid="instance-log-detail">
            {emptyPlaceholder && <span>{emptyPlaceholder.defaultMessage}</span>}
        </div>
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
        useGoBack: () => vi.fn(),
    };
});

describe('ValidateInstance accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            instanceId: '42',
        });
        mockUseGetInstance.mockReturnValue({
            data: { form_name: 'My Form' },
            isLoading: false,
        });
        mockUseApiDiffInstancesList.mockReturnValue({
            data: mockDiffResults(2),
            isLoading: false,
            isError: false,
        });
    });

    it('has no accessibility violations with diff content loaded', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ValidateInstance />,
        );

        expect(
            screen.getByRole('checkbox', { name: 'Show all fields' }),
        ).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with placeholder state', async () => {
        mockUseApiDiffInstancesList.mockReturnValue({
            data: mockDiffResults(0),
            isLoading: false,
            isError: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <ValidateInstance />,
        );

        expect(
            screen.getByText(MESSAGES.noPreviousVersion.defaultMessage),
        ).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
