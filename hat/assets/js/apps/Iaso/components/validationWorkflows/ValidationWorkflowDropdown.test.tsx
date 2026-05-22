import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import { ValidationWorkflowDropdown } from './ValidationWorkflowDropdown';

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

const { mockUserHasPermission } = vi.hoisted(() => {
    return { mockUserHasPermission: vi.fn() };
});

const { mockUseGetWorkflowOptions } = vi.hoisted(() => {
    return { mockUseGetWorkflowOptions: vi.fn() };
});

vi.mock('Iaso/domains/validationWorkflowsConfiguration/api/Get', () => ({
    useGetWorkflowOptions: mockUseGetWorkflowOptions,
}));

const { mockUserHasAccessToModule } = vi.hoisted(() => {
    return { mockUserHasAccessToModule: vi.fn() };
});

vi.mock('Iaso/domains/users/utils', async () => {
    const actual = await vi.importActual('Iaso/domains/users/utils');
    return {
        ...actual,
        userHasAccessToModule: mockUserHasAccessToModule,
        userHasPermission: mockUserHasPermission,
    };
});

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
    };
});

describe('ValidationWorkflowDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser.mockReturnValue({ id: 1 });
        mockUserHasPermission.mockReturnValue(true);
        mockUserHasAccessToModule.mockReturnValue(true);
    });

    it('renders input normally when user has permission and module', () => {
        mockUseGetWorkflowOptions.mockReturnValue({
            data: [{ label: 'A', value: 'a' }],
            isFetching: false,
        });

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).not.toBeDisabled();
        expect(
            screen.queryByLabelText(
                `You're missing the following permission(s): ${VALIDATION_WORKFLOWS}`,
            ),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(mockUseGetWorkflowOptions).toHaveBeenCalledWith(true);
    });

    it('does not render input when user lacks permission', () => {
        mockUserHasPermission.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('does not render input when when user lacks module', () => {
        mockUserHasAccessToModule.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        expect(container.innerHTML).toBe('');
    });

    it('sets loading from hook', () => {
        mockUseGetWorkflowOptions.mockReturnValue({
            data: [],
            isFetching: true,
        });

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('merges external loading with hook loading', () => {
        mockUseGetWorkflowOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown loading keyValue={'vf'} />,
        );

        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('passes workflow options from hook', async () => {
        mockUseGetWorkflowOptions.mockReturnValue({
            data: [{ label: 'Test', value: 'test' }],
            isFetching: false,
        });

        const user = userEvent.setup();

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        const input = screen.getByRole('combobox');
        await act(async () => {
            await user.click(input);
        });

        expect(await screen.findByText('Test')).toBeInTheDocument();
    });

    it('does not call the API when user has no permissions', () => {
        mockUserHasPermission.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({});

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        expect(mockUseGetWorkflowOptions).toHaveBeenCalledWith(false);
    });

    it('does not pass initialValue when user has no permissions', () => {
        mockUserHasPermission.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({});

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} value={1} />,
        );

        expect(
            screen.queryByText('Value not found in possible options'),
        ).not.toBeInTheDocument();
    });

    it('does not call the API when user has no module', () => {
        mockUserHasAccessToModule.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({});

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} />,
        );

        expect(mockUseGetWorkflowOptions).toHaveBeenCalledWith(false);
    });

    it('does not pass initialValue when user has no module', () => {
        mockUserHasAccessToModule.mockReturnValue(false);

        mockUseGetWorkflowOptions.mockReturnValue({});

        renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown keyValue={'vf'} value={1} />,
        );

        expect(
            screen.queryByText('Value not found in possible options'),
        ).not.toBeInTheDocument();
    });
});
