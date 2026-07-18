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
import MESSAGES from 'Iaso/domains/missions/messages';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';
import {
    getApiNotificationMockHandler,
    getCustomEntityTypeOptionsMockHandler,
    getCustomFormOptionsMockHandler,
    getCustomOUTOptionsMockHandler,
} from './mocksAndHandlers';

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

const getFormsCardinalityInput = (
    formName: string | RegExp,
    field: 'min_cardinality' | 'max_cardinality',
) => {
    const row = screen.getByRole('row', { name: formName });
    return within(row).getByRole('textbox', {
        name:
            field === 'min_cardinality'
                ? /min cardinality/i
                : /max cardinality/i,
    });
};

const addForm = async (formOption: string | RegExp) => {
    await act(async () => {
        await userEvent.click(
            screen.getByRole('combobox', {
                name: /select a form to add/i,
            }),
        );
    });

    await act(async () => {
        await userEvent.click(
            screen.getByRole('option', {
                name: formOption,
            }),
        );
    });

    expect(screen.getByText(formOption)).toBeVisible();
};

describe('Mission edit integration test', () => {
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
        faker.seed(1);
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUserHasAllPermissions.mockReturnValue(true);
        mockCurrentUser.mockReturnValue({});
        mockUserHasOneOfPermission.mockReturnValue(true);
        mockUserHasPermission.mockReturnValue(true);
    });

    it('renders loading state', () => {
        vi.stubEnv('MSW_DELAY', '1000000');
        renderEdit();
        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('renders 404 if data is not found', async () => {
        server.use(
            getApiMicroplanningMissionsRetrieveMockHandler(async _info => {
                throw new HttpResponse({}, { status: 404 });
            }),
        );
        renderEdit();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.getByText('404')).toBeVisible();
    });

    it('renders initial data - MISSION_FORM', async () => {
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

        renderEdit();

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
            getFormsCardinalityInput(/form a/i, 'min_cardinality'),
        ).toHaveValue('2');
    });
    it('renders initial data - MISSION_ENTITY_TYPE', async () => {
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
                    forms: [],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        renderEdit();

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
        expect(
            screen.getByRole('textbox', { name: /min cardinality/i }),
        ).toHaveValue('12');
        expect(
            screen.getByRole('textbox', { name: /max cardinality/i }),
        ).toHaveValue('14');
    });
    it('renders initial data - MISSION_ORG_UNIT', async () => {
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

        renderEdit();

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
        expect(
            screen.getByRole('textbox', { name: /min cardinality/i }),
        ).toHaveValue('12');
        expect(
            screen.getByRole('textbox', { name: /max cardinality/i }),
        ).toHaveValue('14');
    });

    it('handles forms uniqueness', async () => {
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

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('Form A')).toBeVisible();

        await act(async () => {
            await userEvent.click(
                screen.getByRole('combobox', {
                    name: /select a form to add/i,
                }),
            );
        });

        expect(
            screen.queryByRole('option', {
                name: /form a/i,
            }),
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole('option', {
                name: /form b/i,
            }),
        ).toBeVisible();

        expect(
            screen.getByRole('option', {
                name: /form c/i,
            }),
        ).toBeVisible();

        // delete form
        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.delete.defaultMessage,
                }),
            );
        });

        expect(screen.queryByText('Form A')).toBeNull();

        // open select again
        await act(async () => {
            await userEvent.click(
                screen.getByRole('combobox', {
                    name: /select a form to add/i,
                }),
            );
        });

        expect(
            screen.queryByRole('option', {
                name: /form a/i,
            }),
        ).toBeVisible();

        expect(
            screen.getByRole('option', {
                name: /form b/i,
            }),
        ).toBeVisible();

        expect(
            screen.getByRole('option', {
                name: /form c/i,
            }),
        ).toBeVisible();
    });

    it('does not call API if form is invalid - MISSION_FORM', async () => {
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
                    forms: [],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            screen.getByRole('button', { name: MESSAGES.save.defaultMessage }),
        ).toBeDisabled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });
    it('does not call API if form is invalid - MISSION_ENTITY_TYPE', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    entity_type: {
                        id: 1,
                        name: 'ET 1',
                    },
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
                    },
                    forms: [],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            screen.getByRole('button', { name: MESSAGES.save.defaultMessage }),
        ).toBeDisabled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });
    it('does not call API if form is invalid - MISSION_ORG_UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    org_unit_type: {
                        id: 1,
                        name: 'OUT 1',
                    },
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                    },
                    forms: [],
                },
            );
        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            screen.getByRole('button', { name: MESSAGES.save.defaultMessage }),
        ).toBeDisabled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('displays errors from backend - MISSION_FORM - general error array', async () => {
        server.use(
            getApiMicroplanningMissionsUpdateMockHandler(async _info => {
                mockUpdate(_info.params.id);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await addForm(/form a/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });
    it('displays errors from backend - MISSION_FORM - array form errors', async () => {
        server.use(
            getApiMicroplanningMissionsUpdateMockHandler(async _info => {
                mockUpdate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        forms: [
                            {
                                form: 'Invalid first form',
                                min_cardinality:
                                    'Invalid first min cardinality',
                            },
                            {
                                max_cardinality:
                                    'Invalid second max cardinality',
                            },
                        ],
                    }),
                    { status: 400 },
                );
            }),
        );

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await addForm(/form a/i);
        await addForm(/form b/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid first form')).toBeVisible();
        expect(screen.getByText('Invalid first min cardinality')).toBeVisible();
        expect(
            screen.getByText('Invalid second max cardinality'),
        ).toBeVisible();
    });
    it('displays errors from backend - MISSION_ENTITY_TYPE', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    entity_type: {
                        id: 1,
                        name: 'ET 1',
                    },
                    min_cardinality: 1,
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
                    },
                    forms: [],
                },
            );

        server.use(
            getApiMicroplanningMissionsRetrieveMockHandler(data),
            getApiMicroplanningMissionsUpdateMockHandler(async _info => {
                mockUpdate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        entity_type: ['Invalid entity type'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await addForm(/form a/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid entity type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });
    it('displays errors from backend - MISSION_ORG_UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    org_unit_type: {
                        id: 1,
                        name: 'OUT 1',
                    },
                    min_cardinality: 1,
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                    },
                    forms: [],
                },
            );

        server.use(
            getApiMicroplanningMissionsRetrieveMockHandler(data),
            getApiMicroplanningMissionsUpdateMockHandler(async _info => {
                mockUpdate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        org_unit_type: ['Invalid org unit type'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await addForm(/form a/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid org unit type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });

    it('submits the data and redirect - MISSION_FORM', async () => {
        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /name/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /description/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await addForm(/form a/i);

        await act(async () => {
            await userEvent.clear(
                getFormsCardinalityInput(/form a/i, 'min_cardinality'),
            );
            await userEvent.type(
                getFormsCardinalityInput(/form a/i, 'min_cardinality'),
                '2',
            );
        });
        await act(async () => {
            await userEvent.type(
                getFormsCardinalityInput(/form a/i, 'max_cardinality'),
                '20',
            );
        });

        await addForm(/form b/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith('1', {
                name: 'name',
                description: 'description',
                forms: [
                    {
                        form: 1,
                        max_cardinality: 20,
                        min_cardinality: 2,
                    },
                    {
                        form: 2,
                        max_cardinality: null,
                        min_cardinality: 1,
                    },
                ],
            });
            expect(mockRedirectTo).toHaveBeenCalledWith(
                `/${baseUrls.missionsDetails}/id/1/`,
            );
        });
    });
    it('submits the data and redirect - MISSION_ENTITY_TYPE', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    entity_type: {
                        id: 1,
                        name: 'ET 1',
                    },
                    min_cardinality: 1,
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
                    },
                    forms: [],
                },
            );

        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));

        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /name/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /description/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /min cardinality/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /min cardinality/i }),
                '2',
            );
        });
        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /max cardinality/i }),
                '20',
            );
        });

        await addForm(/form a/i);

        await addForm(/form b/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith('1', {
                name: 'name',
                description: 'description',
                entity_type: 1,
                min_cardinality: 2,
                max_cardinality: 20,
                forms: [
                    {
                        form: 1,
                        max_cardinality: null,
                        min_cardinality: 1,
                    },
                    {
                        form: 2,
                        max_cardinality: null,
                        min_cardinality: 1,
                    },
                ],
            });
            expect(mockRedirectTo).toHaveBeenCalledWith(
                `/${baseUrls.missionsDetails}/id/1/`,
            );
        });
    });
    it('submits the data and redirect - MISSION_ORG_UNIT', async () => {
        const data =
            getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                {
                    name: 'some name',
                    description: 'some description',
                    org_unit_type: {
                        id: 1,
                        name: 'OUT 1',
                    },
                    min_cardinality: 1,
                    // @ts-ignore
                    mission_type: {
                        label: 'Form filling',
                        value: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
                    },
                    forms: [],
                },
            );

        server.use(getApiMicroplanningMissionsRetrieveMockHandler(data));
        renderEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /name/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /name/i }),
                'name',
            );
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /description/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /description/i }),
                'description',
            );
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /min cardinality/i }),
            );
            await userEvent.type(
                screen.getByRole('textbox', { name: /min cardinality/i }),
                '2',
            );
        });
        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /max cardinality/i }),
                '20',
            );
        });

        await addForm(/form a/i);

        await addForm(/form b/i);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.save.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith('1', {
                name: 'name',
                description: 'description',
                org_unit_type: 1,
                min_cardinality: 2,
                max_cardinality: 20,
                forms: [
                    {
                        form: 1,
                        max_cardinality: null,
                        min_cardinality: 1,
                    },
                    {
                        form: 2,
                        max_cardinality: null,
                        min_cardinality: 1,
                    },
                ],
            });
            expect(mockRedirectTo).toHaveBeenCalledWith(
                `/${baseUrls.missionsDetails}/id/1/`,
            );
        });
    });

    it('redirects to detail view if cancel button is clicked', async () => {
        renderEdit();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(
            screen.getByRole('link', { name: MESSAGES.cancel.defaultMessage }),
        ).toHaveAttribute('href', `/${baseUrls.missionsDetails}/id/1/`);
    });
});
