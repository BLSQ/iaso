import React from 'react';
import {
    screen,
    fireEvent,
    waitFor,
    within,
    act,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { baseUrls } from 'Iaso/constants/urls';
import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
} from '../../../../../../tests/helpers';
import { BulkImportForm } from './BulkImportForm';
import * as uploadHook from './hooks/useUploadCsv';

const { mockRedirectTo } = vi.hoisted(() => {
    return { mockRedirectTo: vi.fn() };
});

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatNumber: (number: number) => number.toString(),
            formatMessage: ({ defaultMessage }: any) => defaultMessage,
        }),
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
        useRedirectTo: () => mockRedirectTo,
    };
});

// mock hooks

const { mockUseGetPermissionsDropDown } = vi.hoisted(() => {
    return { mockUseGetPermissionsDropDown: vi.fn() };
});

const { mockUseGetTeamsDropdown } = vi.hoisted(() => {
    return { mockUseGetTeamsDropdown: vi.fn() };
});

const { mockUseGetUserRolesDropDown } = vi.hoisted(() => {
    return { mockUseGetUserRolesDropDown: vi.fn() };
});

const { mockUseGetProjectsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetProjectsDropdownOptions: vi.fn() };
});

const { mockUseAppLocales } = vi.hoisted(() => {
    return { mockUseAppLocales: vi.fn() };
});

const { mockUseUploadCsv } = vi.hoisted(() => {
    return { mockUseUploadCsv: vi.fn() };
});

vi.mock('./hooks/useUploadCsv', async () => ({
    useUploadCsv: mockUseUploadCsv,
}));

vi.mock('Iaso/domains/projects/hooks/requests', async () => ({
    useGetProjectsDropdownOptions: mockUseGetProjectsDropdownOptions,
}));

vi.mock('Iaso/domains/teams/hooks/requests/useGetTeams', async () => ({
    useGetTeamsDropdown: mockUseGetTeamsDropdown,
}));

vi.mock('Iaso/domains/userRoles/hooks/requests/useGetUserRoles', async () => ({
    useGetUserRolesDropDown: mockUseGetUserRolesDropDown,
}));

vi.mock('Iaso/domains/users/hooks/useGetPermissionsDropdown', async () => ({
    useGetPermissionsDropDown: mockUseGetPermissionsDropDown,
}));

vi.mock('Iaso/domains/app/constants', async () => {
    const actual = await vi.importActual('Iaso/domains/app/constants');
    return {
        ...actual,
        useAppLocales: mockUseAppLocales,
    };
});

describe('BulkImportDialogModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProjectsDropdownOptions.mockReturnValue({
            data: [{ value: 1, label: 'project chip' }],
        });
        mockUseGetPermissionsDropDown.mockReturnValue({
            data: [{ value: 1, label: 'permission chip' }],
        });
        mockUseGetUserRolesDropDown.mockReturnValue({
            data: [{ value: 1, label: 'user role chip' }],
        });
        mockUseGetTeamsDropdown.mockReturnValue({
            data: [{ value: 1, label: 'team chip' }],
        });
        mockUseUploadCsv.mockReturnValue({
            mutateAsync: () => {},
        });
        mockUseAppLocales.mockReturnValue([
            {
                code: 'fr',
                label: 'French',
            },
            { code: 'en', label: 'English' },
        ]);
    });

    it('renders the components', () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm cancelUrl={'/home'} />
            </MemoryRouter>,
        );
        expect(
            document.querySelector('input[type="file"]'),
        ).toBeInTheDocument();
        expect(
            screen.findAllByRole('button', { name: /download template/i }),
        ).not.toBeNull();
        expect(screen.getByTestId('default-values-toggle')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /cancel/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /submit/i }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute(
            'href',
            '/home',
        );
    });

    it('does not render cancel button if no cancel url', () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );
        expect(screen.queryByRole('link', { name: /cancel/i })).toBeNull();
    });

    it('handles file selection - csv', async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );
        const file = new File(
            ['username,email\njohn,john@example.com'],
            'test.csv',
            { type: 'text/csv' },
        );

        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(input.files?.[0]).toBe(file);
        });
    });

    it('handles file selection - xlsx', async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );
        const file = new File(
            ['username,email\njohn,john@example.com'],
            'test.xlsx',
            {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        );

        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(input.files?.[0]).toBe(file);
        });
    });

    it('toggles default values section', async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );
        const checkbox = screen.getByTestId('default-values-toggle');
        fireEvent.click(checkbox);
        expect(within(checkbox).getByRole('checkbox')).toBeChecked();

        await waitFor(() => {
            expect(screen.getByLabelText('Permissions')).toBeVisible();
            expect(screen.getByLabelText('User roles')).toBeVisible();
            expect(screen.getByLabelText('Projects')).toBeVisible();
            expect(screen.getByLabelText('Language')).toBeVisible();
            expect(screen.getByLabelText('Teams')).toBeVisible();
            expect(screen.getByLabelText('Organization')).toBeVisible();
            expect(
                screen.getByRole('button', {
                    name: /org units selected/i,
                }),
            ).toBeVisible();
        });
    });

    it('displays API file_content errors', async () => {
        const error = {
            details: {
                file_content: [
                    { general: 'invalid file type' },
                    { row: 1, details: { username: ['wrong'] } },
                ],
            },
        };

        // Mock the upload hook to return this error
        mockUseUploadCsv.mockReturnValue({
            mutateAsync: vi.fn(),
            isLoading: false,
            error,
        });

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );

        expect(
            screen.getByText('Validation Failed - No Users Created'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Row' }),
        ).toBeInTheDocument();
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
        expect(screen.getByText(/username/i)).toBeInTheDocument();
    });

    it('shows loading spinner when uploading', () => {
        // @ts-ignore
        vi.spyOn(uploadHook, 'useUploadCsv').mockReturnValue({
            mutateAsync: vi.fn(),
            isLoading: true,
            error: null,
        });

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('submits the form with all data when confirm button clicked', async () => {
        const saveMock = vi.fn();
        mockUseUploadCsv.mockReturnValue({
            mutateAsync: saveMock,
            isLoading: false,
            error: null,
        });

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );

        const checkbox = screen.getByTestId('default-values-toggle');
        fireEvent.click(checkbox);
        expect(within(checkbox).getByRole('checkbox')).toBeChecked();

        await waitFor(() => {
            expect(screen.getByLabelText('Permissions')).toBeVisible();
            expect(screen.getByLabelText('User roles')).toBeVisible();
            expect(screen.getByLabelText('Projects')).toBeVisible();
            expect(screen.getByLabelText('Language')).toBeVisible();
            expect(screen.getByLabelText('Teams')).toBeVisible();
            expect(screen.getByLabelText('Organization')).toBeVisible();
            expect(
                screen.getByRole('button', {
                    name: /org units selected/i,
                }),
            ).toBeVisible();
        });

        // fill fields

        const file = new File(
            ['username,email\njohn,john@example.com'],
            'test.csv',
            { type: 'text/csv' },
        );

        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;

        await selectFromComboBoxWithAsync({
            nameComboBox: /permissions/i,
            nameOption: 'permission chip',
        });
        await selectFromComboBoxWithAsync({
            nameComboBox: /user roles/i,
            nameOption: 'user role chip',
        });
        await selectFromComboBoxWithAsync({
            nameComboBox: /projects/i,
            nameOption: 'project chip',
        });
        await selectFromComboBoxWithAsync({
            nameComboBox: /language/i,
            nameOption: 'English',
        });
        await selectFromComboBoxWithAsync({
            nameComboBox: /teams/i,
            nameOption: 'team chip',
        });

        await act(async () => {
            fireEvent.change(
                screen.getByRole('textbox', { name: /organization/i }),
                { target: { value: 'Default organization' } },
            );

            fireEvent.change(input, {
                target: { files: [file] },
            });
        });

        const confirmButton =
            screen.getByText(/submit/i) ||
            screen.getByRole('button', { name: /submit/i });

        expect(confirmButton).not.toBeDisabled();
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(saveMock).toHaveBeenCalled();
        });

        const firstArg = saveMock.mock.calls[0][0];

        expect(firstArg).toStrictEqual({
            file: [file],
            default_organization: 'Default organization',
            default_permissions: [1],
            default_profile_language: 'en',
            default_projects: [1],
            default_teams: [1],
            default_user_roles: [1],
        });
    });

    it('redirects after successful submit', async () => {
        const saveMock = vi.fn();
        mockUseUploadCsv.mockReturnValue({
            mutateAsync: saveMock,
            isLoading: false,
            error: null,
        });

        saveMock.mockImplementation(async (_values, options) => {
            options?.onSuccess?.();
            return {};
        });

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm />
            </MemoryRouter>,
        );

        const file = new File(
            ['username,email\njohn,john@example.com'],
            'test.csv',
            { type: 'text/csv' },
        );

        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;

        await act(async () => {
            fireEvent.change(input, {
                target: { files: [file] },
            });
        });

        const confirmButton =
            screen.getByText(/submit/i) ||
            screen.getByRole('button', { name: /submit/i });

        expect(confirmButton).not.toBeDisabled();
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(saveMock).toHaveBeenCalled();
            expect(mockRedirectTo).toHaveBeenCalledWith(baseUrls.users);
        });
    });
});
