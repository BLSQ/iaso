import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getUsersDropDown } from 'Iaso/domains/instances/hooks/requests/getUsersDropDown';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';

import { UserAsyncSelect } from './UserAsyncSelect';

const { mockUseGetProfilesDropdown, mockQueryClient } = vi.hoisted(() => ({
    mockUseGetProfilesDropdown: vi.fn(),
    mockQueryClient: { fetchQuery: vi.fn() },
}));

vi.mock('react-query', async () => {
    const actual =
        await vi.importActual<typeof import('react-query')>('react-query');
    return {
        ...actual,
        useQueryClient: () => mockQueryClient,
    };
});

vi.mock('Iaso/domains/users/hooks/useGetProfilesDropdown', () => ({
    useGetProfilesDropdown: (...args: unknown[]) =>
        mockUseGetProfilesDropdown(...args),
}));

vi.mock('Iaso/domains/instances/hooks/requests/getUsersDropDown', () => ({
    getUsersDropDown: vi.fn(),
}));

const mockGetUsersDropDown = vi.mocked(getUsersDropDown);

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? ''),
        }),
        AsyncSelect: (props: Record<string, any>) => (
            <div data-testid="async-select-mock">
                <span data-testid="async-key-value">{props.keyValue}</span>
                <span data-testid="async-debounce">{props.debounceTime}</span>
                <span data-testid="async-multi">{String(props.multi)}</span>
                <span data-testid="async-clearable">
                    {String(props.clearable)}
                </span>
                <span data-testid="async-value">
                    {JSON.stringify(props.value)}
                </span>
                <button
                    type="button"
                    data-testid="run-fetch-options"
                    onClick={() => {
                        void props.fetchOptions('typed-query');
                    }}
                >
                    fetch
                </button>
                <button
                    type="button"
                    data-testid="fire-multi-change"
                    onClick={() =>
                        props.onChange(props.keyValue, [
                            { value: '10', label: 'Ten' },
                            { value: '20', label: 'Twenty' },
                        ])
                    }
                >
                    multi change
                </button>
                <button
                    type="button"
                    data-testid="fire-single-change"
                    onClick={() =>
                        props.onChange(props.keyValue, {
                            value: 55,
                            label: 'Fifty-five',
                        })
                    }
                >
                    single change
                </button>
            </div>
        ),
    };
});

describe('UserAsyncSelect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProfilesDropdown.mockReturnValue({
            data: [{ value: 1, label: 'One' }],
            isLoading: false,
            isSuccess: true,
        } as ReturnType<typeof mockUseGetProfilesDropdown>);
        mockGetUsersDropDown.mockResolvedValue([]);
    });

    it('requests dropdown with ids when filterUsers is set', () => {
        renderWithThemeAndIntlProvider(
            <UserAsyncSelect
                handleChange={vi.fn()}
                filterUsers="7,8"
                additionalFilters={{ managedUsersOnly: 'true' }}
            />,
        );

        expect(mockUseGetProfilesDropdown).toHaveBeenCalledWith(
            expect.objectContaining({
                query: { ids: '7,8' },
                additionalFilters: { managedUsersOnly: 'true' },
                triggerWithEmptyQuery: false,
            }),
        );
    });

    it('requests dropdown with empty query when filterUsers is omitted', () => {
        renderWithThemeAndIntlProvider(
            <UserAsyncSelect
                handleChange={vi.fn()}
                additionalFilters={{ teams: '1' }}
            />,
        );

        expect(mockUseGetProfilesDropdown).toHaveBeenCalledWith(
            expect.objectContaining({
                query: {},
                additionalFilters: { teams: '1' },
                triggerWithEmptyQuery: false,
            }),
        );
    });

    it('passes AsyncSelect defaults and selected value from the hook', () => {
        renderWithThemeAndIntlProvider(
            <UserAsyncSelect handleChange={vi.fn()} />,
        );

        expect(screen.getByTestId('async-key-value')).toHaveTextContent(
            'users',
        );
        expect(screen.getByTestId('async-debounce')).toHaveTextContent('500');
        expect(screen.getByTestId('async-multi')).toHaveTextContent('true');
        expect(screen.getByTestId('async-clearable')).toHaveTextContent(
            'false',
        );
        expect(screen.getByTestId('async-value').textContent).toContain('One');
    });

    it('uses clearable when not multi', () => {
        renderWithThemeAndIntlProvider(
            <UserAsyncSelect handleChange={vi.fn()} multi={false} />,
        );

        expect(screen.getByTestId('async-multi')).toHaveTextContent('false');
        expect(screen.getByTestId('async-clearable')).toHaveTextContent('true');
    });

    it('calls getUsersDropDown with query client and additionalFilters', async () => {
        const user = userEvent.setup();
        const extra = { managedUsersOnly: 'true' as const };

        renderWithThemeAndIntlProvider(
            <UserAsyncSelect
                handleChange={vi.fn()}
                additionalFilters={extra}
            />,
        );

        await user.click(screen.getByTestId('run-fetch-options'));

        expect(mockGetUsersDropDown).toHaveBeenCalledWith({
            query: 'typed-query',
            queryClient: mockQueryClient,
            additionalFilters: extra,
        });
    });

    it('maps multi selection to a comma-separated string for handleChange', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        renderWithThemeAndIntlProvider(
            <UserAsyncSelect
                handleChange={handleChange}
                keyValue="myUsers"
                multi
            />,
        );

        await user.click(screen.getByTestId('fire-multi-change'));

        expect(handleChange).toHaveBeenCalledWith('myUsers', '10,20');
    });

    it('maps single selection to the option value for handleChange', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        renderWithThemeAndIntlProvider(
            <UserAsyncSelect
                handleChange={handleChange}
                keyValue="owner"
                multi={false}
            />,
        );

        await user.click(screen.getByTestId('fire-single-change'));

        expect(handleChange).toHaveBeenCalledWith('owner', 55);
    });
});
