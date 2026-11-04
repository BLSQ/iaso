import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event/dist/cjs/index.js';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { getApiNotificationMockHandler } from 'hat/assets/js/__tests__/integration/missions/mocksAndHandlers';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from 'hat/assets/js/tests/helpers';
import {
    getApiMicroplanningMissionsListMockHandler,
    getApiMicroplanningMissionsListResponseMock,
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { Missions } from 'Iaso/domains/missions';

const { mockUserHasOneOfPermission } = vi.hoisted(() => ({
    mockUserHasOneOfPermission: vi.fn(),
}));

const { mockUserHasAllPermissions } = vi.hoisted(() => ({
    mockUserHasAllPermissions: vi.fn(),
}));

const { mockCurrentUser } = vi.hoisted(() => ({
    mockCurrentUser: vi.fn(),
}));

const { mockUserHasPermission } = vi.hoisted(() => {
    return { mockUserHasPermission: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', async () => {
    const actual = await vi.importActual('Iaso/utils/usersUtils');
    return {
        ...actual,
        useCurrentUser: mockCurrentUser,
    };
});

vi.mock('Iaso/domains/users/utils', async () => {
    const actual = await vi.importActual('Iaso/domains/users/utils');
    return {
        ...actual,
        userHasOneOfPermissions: mockUserHasOneOfPermission,
        userHasAllPermissions: mockUserHasAllPermissions,
        userHasPermission: mockUserHasPermission,
    };
});

const server = setupServer(
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler(),
    getApiMicroplanningMissionsListMockHandler(),
    getApiNotificationMockHandler(),
);

const renderList = () => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter initialEntries={[`/${baseUrls.missions}/accountId/1/`]}>
            <Routes>
                <Route
                    path={`/${baseUrls.missions}/*`}
                    element={<Missions />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Missions list a11y tests', () => {
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
        faker.seed(Date.now());
        server.close();
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });
    beforeEach(() => {
        faker.seed(6);
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUserHasAllPermissions.mockReturnValue(true);
        mockCurrentUser.mockReturnValue({});
        mockUserHasOneOfPermission.mockReturnValue(true);
        mockUserHasPermission.mockReturnValue(true);
    });

    // loading spinner not a11y compliant
    it.skip('has no violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        const { container } = renderList();

        expect(screen.queryAllByRole('progressbar').length).toBeGreaterThan(0);
        expect(await axe(container)).toHaveNoViolations();
    });

    // search button not a11y compliant
    it.skip('has no violation when no data', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 0,
            page: 1,
            pages: 1,
            has_next: false,
            has_previous: false,
            results: [],
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));

        const { container } = renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('No result')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    // search button not compliant
    it.skip('has no violation when there is data', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 9,
            page: 1,
            pages: 1,
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));

        const { container } = renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        data?.results?.forEach(
            // @ts-ignore
            ({ name }) => {
                expect(
                    screen.getByRole('cell', { name: name }),
                ).toBeInTheDocument();
            },
        );

        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation when no delete modal is opened', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 1,
            page: 1,
            pages: 1,
        });

        server.use(
            getApiMicroplanningMissionsListMockHandler(async _info => {
                return getApiMicroplanningMissionsListResponseMock({
                    ...data,
                    results: data?.results?.slice(0, 1),
                });
            }),
        );

        const { container } = renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const userEventStp = userEvent.setup();

        await act(async () => {
            await userEventStp.click(screen.getByTestId('DeleteIcon'));
        });

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
        });

        expect(await axe(container)).toHaveNoViolations();
    });
});
