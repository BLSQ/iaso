import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { getUsersDropDown } from 'Iaso/domains/instances/hooks/requests/getUsersDropDown';
import { renderWithTheme } from '../../../tests/helpers';
import { randomProfileDropdownOption } from '../../factories/profileDropdown';

const renderUserAsyncSelect = (ui: React.ReactElement) =>
    renderWithTheme(
        <IntlProvider locale="en" messages={{}}>
            {ui}
        </IntlProvider>,
    );

const { mockUseGetProfilesDropdown } = vi.hoisted(() => ({
    mockUseGetProfilesDropdown: vi.fn(),
}));

vi.mock('Iaso/domains/users/hooks/useGetProfilesDropdown', () => ({
    useGetProfilesDropdown: (...args: unknown[]) =>
        mockUseGetProfilesDropdown(...args),
}));

vi.mock('Iaso/domains/instances/hooks/requests/getUsersDropDown', () => ({
    getUsersDropDown: vi.fn(),
}));

const mockGetUsersDropDown = vi.mocked(getUsersDropDown);

describe('UserAsyncSelect (integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProfilesDropdown.mockReturnValue({
            data: [],
            isLoading: false,
            isSuccess: true,
        } as ReturnType<typeof mockUseGetProfilesDropdown>);
    });

    it('loads selected profile labels when filterUsers matches ids', () => {
        const selected = randomProfileDropdownOption({
            value: 42,
            label: 'Alex Example',
        });
        mockUseGetProfilesDropdown.mockReturnValue({
            data: [selected],
            isLoading: false,
            isSuccess: true,
        } as ReturnType<typeof mockUseGetProfilesDropdown>);

        renderUserAsyncSelect(
            <UserAsyncSelect
                handleChange={vi.fn()}
                filterUsers="42"
                keyValue="launcher"
                multi={false}
            />,
        );

        expect(screen.getByRole('combobox', { name: 'User' })).toHaveValue(
            'Alex Example',
        );
    });

    it('calls handleChange with profile id after async search and select', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        const option = randomProfileDropdownOption({
            value: 901,
            label: 'Searcher Pick',
        });

        mockGetUsersDropDown.mockResolvedValue([option]);

        renderUserAsyncSelect(
            <UserAsyncSelect
                handleChange={handleChange}
                keyValue="validatorId"
                multi={false}
            />,
        );

        const combobox = screen.getByRole('combobox', { name: 'User' });
        await user.click(combobox);
        await user.type(combobox, 'x');

        await waitFor(
            () => {
                expect(
                    screen.getByRole('option', { name: 'Searcher Pick' }),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );

        await user.click(screen.getByRole('option', { name: 'Searcher Pick' }));

        expect(handleChange).toHaveBeenCalledWith('validatorId', 901);
    });
});
