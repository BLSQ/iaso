import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import {
    getApiMicroplanningMissionsDropdownListMockHandler,
    getApiMicroplanningMissionsDropdownListResponseMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { MissionDropdown } from './MissionDropdown';

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

const { mockUserHasPermission } = vi.hoisted(() => {
    return { mockUserHasPermission: vi.fn() };
});

vi.mock('Iaso/domains/users/utils', () => ({
    userHasPermission: mockUserHasPermission,
}));

const mockCallApi = vi.fn();

const getCustomApiMicroplanningMissionsDropdownListMockHandler = (
    overrideResponse?: Parameters<
        typeof getApiMicroplanningMissionsDropdownListMockHandler
    >[0],
    options?: Parameters<
        typeof getApiMicroplanningMissionsDropdownListMockHandler
    >[1],
) => {
    mockCallApi();
    return getApiMicroplanningMissionsDropdownListMockHandler(
        overrideResponse,
        options,
    );
};

const server = setupServer(
    getCustomApiMicroplanningMissionsDropdownListMockHandler(),
);
const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('MissionDropdown test', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        server.listen({
            onUnhandledRequest: 'error',
        });
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
    });

    afterAll(() => {
        server.close();
        faker.seed(Date.now());
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });

    beforeEach(() => {
        faker.seed(6);
        vi.clearAllMocks();
        vi.unstubAllEnvs();

        mockUserHasPermission.mockReturnValue(true);
        mockCurrentUser.mockReturnValue({});
    });

    it('does not render input component if user does not have permissions', () => {
        mockUserHasPermission.mockReturnValue(false);

        renderWithThemeAndIntlProvider(
            <MissionDropdown keyValue={'mission_type'} />,
        );

        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('does not call API if user does not have permissions', async () => {
        mockUserHasPermission.mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <MissionDropdown keyValue={'mission_type'} />,
        );
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(mockCallApi).not.toHaveBeenCalled();
    });

    it('renders input with correct options', async () => {
        const data = getApiMicroplanningMissionsDropdownListResponseMock();
        expect(data?.length).toBeGreaterThan(0);

        server.use(
            getCustomApiMicroplanningMissionsDropdownListMockHandler(data),
        );

        renderWithThemeAndIntlProvider(
            <MissionDropdown keyValue={'mission_type'} />,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.getByRole('combobox')).toBeInTheDocument();

        const user = userEvent.setup();

        await act(async () => {
            await user.click(screen.getByRole('combobox'));
        });

        data?.forEach(({ label }) => {
            expect(screen.getByText(label)).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: label }),
            ).toBeInTheDocument();
        });
    });

    it('renders loading state', () => {
        vi.stubEnv('MSW_DELAY', '1_000_000');
        renderWithThemeAndIntlProvider(
            <MissionDropdown keyValue={'mission_type'} />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
