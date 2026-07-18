import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from 'hat/assets/js/tests/helpers';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
    getApiMicroplanningMissionsRetrieveMockHandler,
    getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock,
    getApiMicroplanningMissionsUpdateMockHandler,
    getApiMicroplanningMissionsUpdateResponseMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionEdit } from 'Iaso/domains/missions/edit';
import {
    getApiNotificationMockHandler,
    getCustomEntityTypeOptionsMockHandler,
    getCustomFormOptionsMockHandler,
    getCustomOUTOptionsMockHandler,
} from '../../../../__tests__/integration/missions/mocksAndHandlers';

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

const renderEdit = (id: number = 1) => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter
            initialEntries={[`/${baseUrls.missionsEdit}/accountId/1/id/${id}/`]}
        >
            <Routes>
                <Route
                    path={`/${baseUrls.missionsEdit}/*`}
                    element={<MissionEdit />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

const defaultRetrieveData =
    getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock({
        name: 'some name',
        description: 'some description',
        // @ts-ignore
        mission_type: {
            label: 'Form filling',
            value: MissionTypeValueEnum.enum.FORM_FILLING,
        },
        forms: [],
    });

const mockUpdate = vi.fn();

const server = setupServer(
    getApiMicroplanningMissionsRetrieveMockHandler(defaultRetrieveData),
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
        Object.entries(MissionTypeValueEnum.enum).map(([label, value]) => ({
            value,
            label,
        })),
    ),
    getApiMicroplanningMissionsUpdateMockHandler(async _info => {
        const body = await _info.request.json();
        mockUpdate(_info.params.id, body);
        return getApiMicroplanningMissionsUpdateResponseMock();
    }),
    getCustomFormOptionsMockHandler(),
    getApiNotificationMockHandler(),
    getCustomOUTOptionsMockHandler(),
    getCustomEntityTypeOptionsMockHandler(),
);

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Mission edit a11y tests', () => {
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
        faker.seed(4);
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUserHasAllPermissions.mockReturnValue(true);
        mockCurrentUser.mockReturnValue({});
        mockUserHasOneOfPermission.mockReturnValue(true);
        mockUserHasPermission.mockReturnValue(true);
    });

    // loading spinner not accessible
    it.skip('has no violation while loading', async () => {
        vi.stubEnv('MSW_DELAY', '1000000');
        const { container } = renderEdit();
        expect(screen.getByRole('progressbar')).toBeVisible();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violation - MISSION FORM', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.FORM_FILLING,
                    },
                    forms: [
                        {
                            form: 1,
                            form_name: 'Form A',
                            min_cardinality: 2,
                            max_cardinality: null,
                        },
                    ],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        const { container } = renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
            'some name',
        );
        expect(
            screen.getByRole('textbox', { name: /description/i }),
        ).toHaveValue('some description');
        expect(screen.getByText('Form A')).toBeVisible();
        expect(
            within(screen.getByRole('row', { name: /form a/i })).getByRole(
                'textbox',
                { name: /min cardinality/i },
            ),
        ).toHaveValue('2');
        // @ts-ignore
        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation - MISSION ORG UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    // @ts-ignore
                    mission_type: {
                        label: 'ORg unit and form',
                        value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                    },
                    org_unit_type: {
                        id: 1,
                        name: 'OUT 1',
                    },
                    min_cardinality: 12,
                    max_cardinality: 14,
                    forms: [],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        const { container } = renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
            'some name',
        );
        expect(
            screen.getByRole('textbox', { name: /description/i }),
        ).toHaveValue('some description');

        expect(
            screen.getByRole('combobox', { name: /org unit type/i }),
        ).toHaveValue('OUT 1');

        expect(await axe(container)).toHaveNoViolations();
    });
    it('has no violation - MISSION ENTITY TYPE', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    // @ts-ignore
                    mission_type: {
                        label: 'Entity and form',
                        value: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
                    },
                    entity_type: {
                        id: 1,
                        name: 'ET 1',
                    },
                    min_cardinality: 12,
                    max_cardinality: 14,
                    forms: [
                        {
                            form: 1,
                            form_name: 'Form A',
                            min_cardinality: 2,
                            max_cardinality: null,
                        },
                    ],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        const { container } = renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
            'some name',
        );
        expect(
            screen.getByRole('textbox', { name: /description/i }),
        ).toHaveValue('some description');

        expect(
            screen.getByRole('combobox', { name: /entity type/i }),
        ).toHaveValue('ET 1');

        // @ts-ignore
        expect(await axe(container)).toHaveNoViolations();
    });
});
