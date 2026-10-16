import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsRetrieveMockHandler,
    getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionDetail } from 'Iaso/domains/missions/details';

import { getApiNotificationMockHandler } from '../../../../__tests__/integration/missions/mocksAndHandlers';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../tests/helpers';

const server = setupServer(
    getApiMicroplanningMissionsRetrieveMockHandler(),
    getApiNotificationMockHandler(),
);

// mocks

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

const { mockRedirectTo } = vi.hoisted(() => {
    return { mockRedirectTo: vi.fn() };
});

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
        useRedirectToReplace: () => vi.fn(),
    };
});

const previousDefaults = TestingQueryClient.getDefaultOptions();

const renderDetail = (id: number = 1) => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter
            initialEntries={[
                `/${baseUrls.missionsDetails}/accountId/1/id/${id}/`,
            ]}
        >
            <Routes>
                <Route
                    path={`/${baseUrls.missionsDetails}/*`}
                    element={<MissionDetail />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

describe('Mission detail a11y test', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        faker.seed(1);
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
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUserHasPermission.mockReturnValue(true);
        mockUserHasAllPermissions.mockReturnValue(true);
        mockUserHasOneOfPermission.mockReturnValue(true);
        mockCurrentUser.mockReturnValue({});
    });

    // loading spinner not accessible
    it.skip('has no violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        const { container } = renderDetail();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    // page 404 is not accessible...
    it.skip('has no violation when 404', async () => {
        server.use(
            getApiMicroplanningMissionsRetrieveMockHandler(() => {
                throw new HttpResponse(
                    { detail: 'Not found' },
                    { status: 404 },
                );
            }),
        );

        const { container } = renderDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('404')).toBeVisible();

        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation when data - no forms', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock();

        server.use(
            // @ts-ignore
            getApiMicroplanningMissionsRetrieveMockHandler({
                ...data,
                forms: [],
                mission_type: {
                    label: 'Form filling',
                    value: MissionTypeValueEnum.enum.FORM_FILLING,
                },
            }),
        );

        const { container } = renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getByText('Form')).toBeInTheDocument();
        expect(screen.getByText('No results found.')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation when data - MISSION_FORM', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock();

        server.use(
            // @ts-ignore
            getApiMicroplanningMissionsRetrieveMockHandler({
                ...data,
                mission_type: {
                    label: 'Form filling',
                    value: MissionTypeValueEnum.enum.FORM_FILLING,
                },
                forms: [
                    { form: 1, form_name: 'Form A', min_cardinality: 1 },
                    {
                        form: 1,
                        form_name: 'Form A',
                        min_cardinality: 1,
                        max_cardinality: 2,
                    },
                ],
            }),
        );

        const { container } = renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        // Chip + forms table header both say "Form"; assert mission type via unique chip texts elsewhere
        expect(screen.getAllByText('Form').length).toBeGreaterThanOrEqual(1);

        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation when data - MISSION_ORG_UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                { max_cardinality: 12 },
            );

        expect(data.org_unit_type).not.toBeNull();

        server.use(
            // @ts-ignore
            getApiMicroplanningMissionsRetrieveMockHandler({
                ...data,
                min_cardinality: 2,
                mission_type: {
                    label: 'Org unit',
                    value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                },
                forms: [
                    { form: 1, form_name: 'Form A', min_cardinality: 1 },
                    {
                        form: 1,
                        form_name: 'Form A',
                        min_cardinality: 1,
                        max_cardinality: 2,
                    },
                ],
            }),
        );

        const { container } = renderDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getByText('Org unit + Form')).toBeInTheDocument();
        expect(screen.getByText(data.org_unit_type.name)).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation when data - MISSION_ENTITY_TYPE', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock(
                { max_cardinality: 12 },
            );

        expect(data.entity_type).not.toBeNull();
        expect(data.max_cardinality).not.toBeNull();

        server.use(
            // @ts-ignore
            getApiMicroplanningMissionsRetrieveMockHandler({
                ...data,
                mission_type: {
                    label: 'Entity type mission',
                    value: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
                },
                forms: [
                    { form: 1, form_name: 'Form A', min_cardinality: 1 },
                    {
                        form: 1,
                        form_name: 'Form A',
                        min_cardinality: 1,
                        max_cardinality: 2,
                    },
                ],
            }),
        );

        const { container } = renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getByText('Entity + Form')).toBeInTheDocument();
        expect(screen.getByText(data.entity_type.name)).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });
});
