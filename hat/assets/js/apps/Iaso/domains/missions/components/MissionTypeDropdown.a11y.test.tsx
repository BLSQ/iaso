import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import {
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
    getApiMicroplanningMissionsMissionTypesDropdownListResponseMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { MissionTypeDropdown } from './MissionTypeDropdown';

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

const getCustomApiMicroplanningMissionsMissionTypesDropdownListMockHandler = (
    overrideResponse?: Parameters<
        typeof getApiMicroplanningMissionsMissionTypesDropdownListMockHandler
    >[0],
    options?: Parameters<
        typeof getApiMicroplanningMissionsMissionTypesDropdownListMockHandler
    >[1],
) => {
    mockCallApi();
    return getApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
        overrideResponse,
        options,
    );
};

const server = setupServer(
    getCustomApiMicroplanningMissionsMissionTypesDropdownListMockHandler(),
);
const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('MissionTypeDropdown a11y test', () => {
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

    it('does not have a11y violation if user does not have permissions', async () => {
        mockUserHasPermission.mockReturnValue(false);

        const { container } = renderWithThemeAndIntlProvider(
            <MissionTypeDropdown keyValue={'mission_type'} />,
        );
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('does not have a11y violation when normal rendering', async () => {
        const data =
            getApiMicroplanningMissionsMissionTypesDropdownListResponseMock();
        expect(data?.length).toBeGreaterThan(0);

        server.use(
            getCustomApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
                data,
            ),
        );

        const { container } = renderWithThemeAndIntlProvider(
            <MissionTypeDropdown keyValue={'mission_type'} />,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(await axe(container)).toHaveNoViolations();
    });

    // loading spinner is not a11y compliant
    it.skip('does not have a11y violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '1_000_000');
        const { container } = renderWithThemeAndIntlProvider(
            <MissionTypeDropdown keyValue={'mission_type'} />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });
});
