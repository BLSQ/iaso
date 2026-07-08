import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import MESSAGES from './messages';
import { mockDiffResults } from './testFixtures';
import { ValidateInstance } from './index';

const {
    mockUseParamsObject,
    mockUseGetInstance,
    mockUseApiDiffInstancesList,
    mockGoBack,
    captureInstanceLogDetailProps,
    captureValidationPaperProps,
} = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockUseGetInstance: vi.fn(),
    mockUseApiDiffInstancesList: vi.fn(),
    mockGoBack: vi.fn(),
    captureInstanceLogDetailProps: vi.fn(),
    captureValidationPaperProps: vi.fn(),
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
    default: ({
        title,
        goBack,
        displayBackButton,
    }: {
        title: string;
        goBack: () => void;
        displayBackButton?: boolean;
    }) => (
        <div data-testid="top-bar">
            <span>{title}</span>
            {displayBackButton && (
                <button type="button" onClick={goBack}>
                    Back
                </button>
            )}
        </div>
    ),
}));

vi.mock('./components/ValidationPaper/ValidationPaper', () => ({
    ValidationPaper: (props: { formName: string }) => {
        captureValidationPaperProps(props);
        return <div data-testid="validation-paper">{props.formName}</div>;
    },
}));

vi.mock('../compare/components/InstanceLogDetail', () => ({
    InstanceLogDetail: (props: Record<string, unknown>) => {
        captureInstanceLogDetailProps(props);
        const emptyPlaceholder = props.emptyPlaceholder as
            | { defaultMessage?: string }
            | undefined;
        return (
            <div data-testid="instance-log-detail">
                {props.isLogDetailLoading && (
                    <div role="progressbar">Loading</div>
                )}
                {props.isLogDetailError && <div role="alert">Diff error</div>}
                {emptyPlaceholder && (
                    <span data-testid="empty-placeholder">
                        {emptyPlaceholder.defaultMessage}
                    </span>
                )}
                {props.instanceLogContent != null && (
                    <span data-testid="log-content">
                        {JSON.stringify(props.instanceLogContent)}
                    </span>
                )}
            </div>
        );
    },
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
        useGoBack: () => mockGoBack,
    };
});

describe('ValidateInstance', () => {
    const baseParams = {
        accountId: '1',
        instanceId: '42',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParamsObject.mockReturnValue(baseParams);
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

    it('renders TopBar with validate instance title and back button', () => {
        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(
            screen.getByText(MESSAGES.validateInstance.defaultMessage),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Back' }),
        ).toBeInTheDocument();
    });

    it('calls goBack when back button is clicked', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<ValidateInstance />);

        await user.click(screen.getByRole('button', { name: 'Back' }));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it('does not render diff panel while instance is loading', () => {
        mockUseGetInstance.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(
            screen.queryByTestId('instance-log-detail'),
        ).not.toBeInTheDocument();
    });

    it('shows diff loading spinner when instance loaded and diff loading', () => {
        mockUseApiDiffInstancesList.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });

        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(captureInstanceLogDetailProps).toHaveBeenCalledWith(
            expect.objectContaining({ isLogDetailLoading: true }),
        );
    });

    it('shows comparison table when diff has two results', () => {
        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(screen.getByTestId('log-content')).toBeInTheDocument();
        expect(
            screen.getByRole('checkbox', { name: 'Show all fields' }),
        ).toBeInTheDocument();
    });

    it('shows placeholder when diff has fewer than two results', () => {
        mockUseApiDiffInstancesList.mockReturnValue({
            data: mockDiffResults(0),
            isLoading: false,
            isError: false,
        });

        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(screen.getByTestId('empty-placeholder')).toHaveTextContent(
            MESSAGES.noPreviousVersion.defaultMessage,
        );
        expect(
            screen.queryByRole('checkbox', { name: 'Show all fields' }),
        ).not.toBeInTheDocument();
    });

    it('shows error state when diff API fails', () => {
        mockUseApiDiffInstancesList.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(screen.getByRole('alert')).toHaveTextContent('Diff error');
    });

    it('renders ValidationPaper with form name when instance is loaded', () => {
        renderWithThemeAndIntlProvider(<ValidateInstance />);

        expect(screen.getByTestId('validation-paper')).toHaveTextContent(
            'My Form',
        );
        expect(captureValidationPaperProps).toHaveBeenCalledWith({
            formName: 'My Form',
        });
    });

    it('passes filtered diff content by default and full content when toggle is on', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<ValidateInstance />);

        const filteredContent =
            captureInstanceLogDetailProps.mock.calls.at(-1)?.[0]
                ?.instanceLogContent;
        expect(filteredContent?.logA?.json).toEqual({ field_a: 'old' });
        expect(filteredContent?.logB?.json).toEqual({ field_a: 'new' });
        expect(filteredContent?.fields).toEqual([{ name: 'field_a' }]);

        await user.click(
            screen.getByRole('checkbox', { name: 'Show all fields' }),
        );

        const fullContent =
            captureInstanceLogDetailProps.mock.calls.at(-1)?.[0]
                ?.instanceLogContent;
        expect(fullContent?.logA?.json).toEqual({
            field_a: 'old',
            field_b: 'unchanged',
        });
        expect(fullContent?.logB?.json).toEqual({
            field_a: 'new',
            field_b: 'unchanged',
        });
        expect(fullContent?.fields).toEqual([
            { name: 'field_a' },
            { name: 'field_b' },
        ]);
    });
});
