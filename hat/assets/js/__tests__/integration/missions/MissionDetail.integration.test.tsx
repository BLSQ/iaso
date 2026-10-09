import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event/dist/cjs/index.js';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsDestroyMockHandler,
    getApiMicroplanningMissionsRetrieveMockHandler,
    getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionDetail } from 'Iaso/domains/missions/details';
import MESSAGES from 'Iaso/domains/missions/messages';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';
import { getApiNotificationMockHandler } from './mocksAndHandlers';

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

const { mockRedirectToReplace } = vi.hoisted(() => {
    return { mockRedirectToReplace: vi.fn() };
});

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
        useRedirectToReplace: () => mockRedirectToReplace,
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

describe('Mission detail integration test', () => {
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

    it('renders loading state', () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        renderDetail();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders a 404 if not found', async () => {
        server.use(
            getApiMicroplanningMissionsRetrieveMockHandler(() => {
                throw new HttpResponse(
                    { detail: 'Not found' },
                    { status: 404 },
                );
            }),
        );

        renderDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('404')).toBeVisible();
    });

    it('renders data - MISSION FORM', async () => {
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
            }),
        );

        renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getAllByText('Form').length).toBeGreaterThanOrEqual(1);

        data?.forms?.forEach(
            ({ form_name, min_cardinality, max_cardinality }) => {
                expect(
                    screen.getByRole('cell', { name: form_name }),
                ).toBeInTheDocument();
                expect(
                    screen.getByRole('cell', {
                        name: min_cardinality.toLocaleString(),
                    }),
                ).toBeInTheDocument();
                if (max_cardinality) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', {
                            name: max_cardinality.toLocaleString(),
                        }),
                    ).toBeInTheDocument();
                }
            },
        );
    });

    it('renders data - MISSION ORG UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                { max_cardinality: 12 },
            );

        expect(data.org_unit_type).not.toBeNull();

        server.use(
            // @ts-ignore
            getApiMicroplanningMissionsRetrieveMockHandler({
                ...data,
                mission_type: {
                    label: 'Org unit',
                    value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                },
            }),
        );

        renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getByText('Org unit + Form')).toBeInTheDocument();
        expect(screen.getByText(data.org_unit_type.name)).toBeInTheDocument();
        expect(
            screen.getByText(data.min_cardinality.toLocaleString()),
        ).toBeInTheDocument();
        if (data?.max_cardinality) {
            // eslint-disable-next-line vitest/no-conditional-expect
            expect(
                screen.getByText(data.max_cardinality.toLocaleString()),
            ).toBeInTheDocument();
        }

        data?.forms?.forEach(
            ({ form_name, min_cardinality, max_cardinality }) => {
                expect(
                    screen.getByRole('cell', { name: form_name }),
                ).toBeInTheDocument();
                expect(
                    screen.getByRole('cell', {
                        name: min_cardinality.toLocaleString(),
                    }),
                ).toBeInTheDocument();
                if (max_cardinality) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', {
                            name: max_cardinality.toLocaleString(),
                        }),
                    ).toBeInTheDocument();
                }
            },
        );
    });
    it('renders data - MISSION ENTITY', async () => {
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
            }),
        );

        renderDetail();

        // general info
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(data.name)).toBeInTheDocument();
        expect(screen.getByText(data.description)).toBeInTheDocument();
        expect(screen.getByText('Entity + Form')).toBeInTheDocument();
        expect(screen.getByText(data.entity_type.name)).toBeInTheDocument();
        expect(
            screen.getByText(data.min_cardinality.toLocaleString()),
        ).toBeInTheDocument();
        if (data?.max_cardinality) {
            // eslint-disable-next-line vitest/no-conditional-expect
            expect(
                screen.getByText(data.max_cardinality.toLocaleString()),
            ).toBeInTheDocument();
        }

        data?.forms?.forEach(
            ({ form_name, min_cardinality, max_cardinality }) => {
                expect(
                    screen.getByRole('cell', { name: form_name }),
                ).toBeInTheDocument();
                expect(
                    screen.getByRole('cell', {
                        name: min_cardinality.toLocaleString(),
                    }),
                ).toBeInTheDocument();
                if (max_cardinality) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(
                        screen.getByRole('cell', {
                            name: max_cardinality.toLocaleString(),
                        }),
                    ).toBeInTheDocument();
                }
            },
        );
    });

    it('renders a delete / edit button if user has perms', async () => {
        renderDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const editLink = screen.getByRole('link', {
            name: MESSAGES.edit.defaultMessage,
        });
        expect(editLink).toBeInTheDocument();
        expect(editLink).toHaveAttribute(
            'href',
            `/${baseUrls.missionsEdit}/id/1/`,
        );

        expect(
            screen.getByRole('button', {
                name: MESSAGES.delete.defaultMessage,
            }),
        ).toBeInTheDocument();
    });
    it("does not render a delete / edit button if user doesn't have perms", async () => {
        mockUserHasPermission.mockReturnValue(false);
        mockUserHasOneOfPermission.mockReturnValue(false);
        mockUserHasAllPermissions.mockReturnValue(false);

        renderDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(
            screen.queryByRole('link', {
                name: MESSAGES.edit.defaultMessage,
            }),
        ).toBeNull();

        expect(
            screen.queryByRole('button', {
                name: MESSAGES.delete.defaultMessage,
            }),
        ).toBeNull();
    });

    it('calls delete', async () => {
        const mockDelete = vi.fn();

        server.use(
            getApiMicroplanningMissionsDestroyMockHandler(async _info => {
                mockDelete(_info.params.id);
                throw new HttpResponse(null, { status: 204 });
            }),
        );
        renderDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const userEventStp = userEvent.setup();

        await act(async () => {
            await userEventStp.click(
                screen.getByRole('button', { name: /delete/i }),
            );
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
            expect(mockDelete).toHaveBeenCalledWith('1');
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(mockRedirectTo).toHaveBeenCalledWith(baseUrls.missions);
        });
    });
});
