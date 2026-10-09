import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event/dist/cjs/index.js';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    ApiMicroplanningMissionsListParams,
    MissionTypeValueEnum,
} from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsDestroyMockHandler,
    getApiMicroplanningMissionsListMockHandler,
    getApiMicroplanningMissionsListResponseMock,
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { Missions } from 'Iaso/domains/missions';
import MESSAGES from 'Iaso/domains/missions/messages';
import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
    TestingQueryClient,
} from '../../../tests/helpers';
import { getApiNotificationMockHandler } from './mocksAndHandlers';

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

describe('Mission list integration test', () => {
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

    it('renders a loading state', () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        renderList();
        expect(screen.queryAllByRole('progressbar').length).toBeGreaterThan(0);
    });
    it("displays no results if there aren't any", async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 0,
            page: 1,
            pages: 1,
            has_next: false,
            has_previous: false,
            results: [],
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('No result')).toBeInTheDocument();
    });
    it('displays data', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 9,
            page: 1,
            pages: 1,
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const uniqueMissionTypes = data?.results
            ?.map(({ mission_type }) => mission_type)
            .reduce((acc: Record<string, number>, item) => {
                acc[item] = (acc[item] || 0) + 1;
                return acc;
            }, {});

        const missionTypeChipLabels: Record<string, string> = {
            [MissionTypeValueEnum.enum.FORM_FILLING]: 'Form',
            [MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM]: 'Org unit + Form',
            [MissionTypeValueEnum.enum.ENTITY_AND_FORM]: 'Entity + Form',
        };

        Object.entries(uniqueMissionTypes ?? {})?.forEach(([item, count]) => {
            const label = missionTypeChipLabels[item] ?? item;
            expect(screen.getAllByRole('cell', { name: label })).toHaveLength(
                count,
            );
        });

        data?.results?.forEach(
            // @ts-ignore
            ({ name, forms_count, entity_type, org_unit_type }) => {
                expect(
                    screen.getByRole('cell', { name: name }),
                ).toBeInTheDocument();

                if (forms_count) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', {
                            name: forms_count.toLocaleString(),
                        }),
                    ).toBeInTheDocument();
                }

                if (entity_type) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', { name: entity_type.name }),
                    ).toBeInTheDocument();
                }

                if (org_unit_type) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', { name: org_unit_type.name }),
                    ).toBeInTheDocument();
                }
            },
        );
    });
    it('displays view details link and icons', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 1,
            page: 1,
            pages: 1,
        });
        server.use(
            getApiMicroplanningMissionsListMockHandler({
                ...data,
                results: data?.results?.slice(0, 1),
            }),
        );

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryAllByTestId('SettingsIcon')).toHaveLength(1);
        expect(screen.queryAllByTestId('RemoveRedEyeIcon')).toHaveLength(1);
        expect(screen.queryAllByTestId('DeleteIcon')).toHaveLength(1);

        const editLink = screen.getByTestId('SettingsIcon').closest('a');
        expect(editLink).toHaveAttribute(
            'href',
            `/${baseUrls.missionsEdit}/id/${data?.results?.[0]?.id}/`,
        );

        const viewLink = screen.getByTestId('RemoveRedEyeIcon').closest('a');
        expect(viewLink).toHaveAttribute(
            'href',
            `/${baseUrls.missionsDetails}/id/${data?.results?.[0]?.id}/`,
        );
    });

    it('does not display edit / create / delete button if the user does not have permission', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 9,
            page: 1,
            pages: 1,
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));
        mockUserHasOneOfPermission.mockReturnValue(false);
        mockUserHasAllPermissions.mockReturnValue(false);
        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        expect(
            screen.queryByRole('link', {
                name: MESSAGES.create.defaultMessage,
            }),
        ).toBeNull();

        expect(screen.queryByTestId('EditIcon')).toBeNull();
        expect(screen.queryByTestId('DeleteIcon')).toBeNull();
    });

    it('searches with the right parameters', async () => {
        const mockList = vi.fn();
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 0,
            page: 1,
            pages: 1,
            results: [],
        });

        server.use(
            getApiMicroplanningMissionsListMockHandler(async _info => {
                mockList(_info);
                return getApiMicroplanningMissionsListResponseMock(data);
            }),
            getApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
                Object.entries(MissionTypeValueEnum.enum).map(
                    ([label, value]) => ({
                        value,
                        label,
                    }),
                ),
            ),
        );

        renderList();

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /search/i }),
                'something',
            );
        });

        await selectFromComboBoxWithAsync({
            nameComboBox: /mission type/i,
            nameOption: MissionTypeValueEnum.enum.FORM_FILLING,
        });

        const searchButton = screen.getByRole('button', { name: /search/i });
        await waitFor(() => {
            expect(searchButton).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(searchButton);
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(2);
        });

        const lastCall = mockList.mock.lastCall?.[0];

        const url = new URL(lastCall.request.url);

        expect(url.searchParams.get('search')).toBe('something');
        expect(url.searchParams.get('mission_type')).toBe(
            MissionTypeValueEnum.enum.FORM_FILLING,
        );
        const { limit, page, ...params } = Object.fromEntries(
            url.searchParams.entries(),
        );

        expect(() =>
            ApiMicroplanningMissionsListParams.parse({
                limit: parseInt(limit),
                page: parseInt(page),
                ...params,
            }),
        ).not.toThrow();
    });

    it('has a create button', async () => {
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 9,
            page: 1,
            pages: 1,
        });
        server.use(getApiMicroplanningMissionsListMockHandler(data));

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            screen.getByRole('link', { name: MESSAGES.create.defaultMessage }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: MESSAGES.create.defaultMessage }),
        ).toHaveAttribute('href', `/${baseUrls.missionsCreate}`);
    });

    it('calls delete and refreshes the query', async () => {
        const mockList = vi.fn();
        const mockDelete = vi.fn();
        const data = getApiMicroplanningMissionsListResponseMock({
            count: 1,
            page: 1,
            pages: 1,
        });

        server.use(
            getApiMicroplanningMissionsListMockHandler(async _info => {
                mockList(_info);
                return getApiMicroplanningMissionsListResponseMock({
                    ...data,
                    results: data?.results?.slice(0, 1),
                });
            }),
            getApiMicroplanningMissionsDestroyMockHandler(async _info => {
                mockDelete(_info.params.id);
                throw new HttpResponse(null, { status: 204 });
            }),
        );

        renderList();

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(1);
        });

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

        const modal = screen.getByRole('dialog');
        const saveButton = within(modal).getByRole('button', { name: /yes/i });
        await act(async () => {
            await userEventStp.click(saveButton);
        });

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith(
                data?.results?.[0]?.id.toString(),
            );
            expect(mockList).toHaveBeenCalledTimes(2);
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });
});
