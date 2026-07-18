import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsCreateMockHandler,
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionCreate } from 'Iaso/domains/missions/create';
import MESSAGES from 'Iaso/domains/missions/messages';
import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
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

const renderCreate = () => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter
            initialEntries={[`/${baseUrls.missionsCreate}/accountId/1/`]}
        >
            <Routes>
                <Route
                    path={`/${baseUrls.missionsCreate}/*`}
                    element={<MissionCreate />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

// handlers

const mockCreate = vi.fn();

const server = setupServer(
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
        Object.entries(MissionTypeValueEnum.enum).map(([label, value]) => ({
            value,
            label,
        })),
    ),
    getApiMicroplanningMissionsCreateMockHandler(async _info => {
        const body = await _info.request.json();
        mockCreate(body);
        return { id: 2, mission_type: MissionTypeValueEnum.enum.FORM_FILLING };
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

const switchMissionType = async (
    missionType: (typeof MissionTypeValueEnum.enum)[keyof typeof MissionTypeValueEnum.enum],
) => {
    const labels: Record<string, RegExp> = {
        [MissionTypeValueEnum.enum.FORM_FILLING]: /^form$/i,
        [MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM]: /org unit \+ form/i,
        [MissionTypeValueEnum.enum.ENTITY_AND_FORM]: /entity \+ form/i,
    };

    await act(async () => {
        await userEvent.click(
            screen.getByRole('radio', {
                name: labels[missionType],
            }),
        );
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
describe('Mission create integration test', () => {
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

    it('initially displays basic fields', async () => {
        act(() => {
            renderCreate();
        });

        expect(
            screen.getByRole('textbox', { name: /name/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('textbox', { name: /description/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('radio', { name: /^form$/i }),
        ).toBeChecked();
        expect(
            screen.getByRole('radio', { name: /org unit \+ form/i }),
        ).not.toBeChecked();
        expect(
            screen.getByRole('radio', { name: /entity \+ form/i }),
        ).not.toBeChecked();

        expect(
            screen.getByRole('combobox', { name: /select a form to add/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: MESSAGES.create.defaultMessage,
            }),
        ).toBeInTheDocument();
    });

    it('renders dynamic fields considering mission type choice', async () => {
        act(() => {
            renderCreate();
        });

        // FORM_FILLING by default
        expect(
            screen.getByRole('combobox', { name: /select a form to add/i }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('combobox', { name: /org unit type/i }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('combobox', { name: /entity type/i }),
        ).not.toBeInTheDocument();

        // switch to org unit mission
        await switchMissionType(MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM);

        await waitFor(() => {
            expect(
                screen.getByRole('combobox', {
                    name: /org unit type/i,
                }),
            ).toBeVisible();
        });

        expect(screen.getByLabelText(/min cardinality/i)).toBeInTheDocument();

        expect(screen.getByLabelText(/max cardinality/i)).toBeInTheDocument();

        expect(
            screen.queryByRole('combobox', {
                name: /entity type/i,
            }),
        ).not.toBeInTheDocument();

        // switch to entity mission

        await switchMissionType(MissionTypeValueEnum.enum.ENTITY_AND_FORM);

        await waitFor(() => {
            expect(
                screen.getByRole('combobox', {
                    name: /entity type/i,
                }),
            ).toBeVisible();
        });

        expect(
            screen.queryByRole('combobox', {
                name: /org unit type/i,
            }),
        ).not.toBeInTheDocument();
    });

    it('erase errors and fields when changing mission type', async () => {
        act(() => {
            renderCreate();
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await addForm(/form a/i);

        expect(screen.getByText('Form A')).toBeVisible();

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.delete.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeVisible();
            expect(
                within(screen.getByRole('alert')).getByText(
                    /too small: expected array to have >=1 items/i,
                ),
            ).toBeVisible();
        });

        // switch mission type
        await switchMissionType(MissionTypeValueEnum.enum.ENTITY_AND_FORM);

        await waitFor(() => {
            expect(screen.queryByText('Form A')).not.toBeInTheDocument();
            expect(screen.queryByRole('alert')).toBeNull();
        });

        expect(
            screen.getByRole('combobox', {
                name: /entity type/i,
            }),
        ).toBeVisible();

        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /entity type/i,
                nameOption: 'ET 1',
            });
        });

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('combobox', { name: /entity type\*/i }),
            );
        });

        expect(
            screen.getByText(/Invalid input: expected number, received null/i),
        ).toBeVisible();

        await switchMissionType(MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM);

        expect(
            screen.queryByText(
                /Invalid input: expected number, received null/i,
            ),
        ).toBeNull();
    });

    it('handles forms uniqueness', async () => {
        act(() => {
            renderCreate();
        });

        // add first form
        await addForm(/form a/i);

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
        act(() => {
            renderCreate();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', {
                    name: /name/i,
                }),
                'Mission',
            );
        });

        // no forms added

        expect(
            screen.getByRole('button', {
                name: MESSAGES.create.defaultMessage,
            }),
        ).toBeDisabled();

        expect(mockCreate).not.toHaveBeenCalled();
    });
    it('does not call API if form is invalid - MISSION_ENTITY_TYPE', async () => {
        act(() => {
            renderCreate();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', {
                    name: /name/i,
                }),
                'Mission',
            );
        });

        await switchMissionType(MissionTypeValueEnum.enum.ENTITY_AND_FORM);

        expect(
            screen.getByRole('button', {
                name: MESSAGES.create.defaultMessage,
            }),
        ).toBeDisabled();

        expect(mockCreate).not.toHaveBeenCalled();
    });
    it('does not call API if form is invalid - MISSION_ORG_UNIT', async () => {
        act(() => {
            renderCreate();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', {
                    name: /name/i,
                }),
                'Mission',
            );
        });

        await switchMissionType(MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM);

        expect(
            screen.getByRole('button', {
                name: MESSAGES.create.defaultMessage,
            }),
        ).toBeDisabled();

        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('displays errors from backend - MISSION_FORM - generic form errors', async () => {
        server.use(
            getApiMicroplanningMissionsCreateMockHandler(async _info => {
                mockCreate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        mission_type: ['Invalid mission_type'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        act(() => {
            renderCreate();
        });

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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid mission_type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });

    it('displays errors from backend - MISSION_FORM - array form errors', async () => {
        server.use(
            getApiMicroplanningMissionsCreateMockHandler(async _info => {
                mockCreate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        mission_type: ['Invalid mission_type'],
                        forms: [
                            {
                                min_cardinality:
                                    'Invalid first min cardinality',
                            },
                            {
                                form: 'Invalid second form',
                                max_cardinality:
                                    'Invalid second max cardinality',
                            },
                        ],
                    }),
                    { status: 400 },
                );
            }),
        );

        act(() => {
            renderCreate();
        });

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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid mission_type')).toBeVisible();
        expect(screen.getByText('Invalid second form')).toBeVisible();
        expect(screen.getByText('Invalid first min cardinality')).toBeVisible();
        expect(
            screen.getByText('Invalid second max cardinality'),
        ).toBeVisible();
    });

    it('displays errors from backend - MISSION_ENTITY_TYPE', async () => {
        server.use(
            getApiMicroplanningMissionsCreateMockHandler(async _info => {
                mockCreate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        mission_type: ['Invalid mission_type'],
                        entity_type: ['Invalid entity type'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        act(() => {
            renderCreate();
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await switchMissionType(MissionTypeValueEnum.enum.ENTITY_AND_FORM);

        await selectFromComboBoxWithAsync({
            nameComboBox: /entity type/i,
            nameOption: 'ET 1',
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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid mission_type')).toBeVisible();
        expect(screen.getByText('Invalid entity type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });
    it('displays errors from backend - MISSION_ORG_UNIT', async () => {
        server.use(
            getApiMicroplanningMissionsCreateMockHandler(async _info => {
                mockCreate(_info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Invalid name'],
                        description: ['Invalid description'],
                        mission_type: ['Invalid mission_type'],
                        org_unit_type: ['Invalid org unit type'],
                        forms: {
                            non_field_errors: ['Generic forms error'],
                        },
                    }),
                    { status: 400 },
                );
            }),
        );

        act(() => {
            renderCreate();
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await switchMissionType(MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM);

        await selectFromComboBoxWithAsync({
            nameComboBox: /org unit type/i,
            nameOption: 'OUT 1',
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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid mission_type')).toBeVisible();
        expect(screen.getByText('Invalid org unit type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();
    });

    it('submits the data and redirect - MISSION_FORM', async () => {
        act(() => {
            renderCreate();
        });

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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalledWith({
                name: 'name',
                description: 'description',
                mission_type: MissionTypeValueEnum.enum.FORM_FILLING,
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
                `${baseUrls.missionsDetails}/id/2`,
            );
        });
    });
    it('submits the data and redirect - MISSION_ENTITY_TYPE', async () => {
        act(() => {
            renderCreate();
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await switchMissionType(MissionTypeValueEnum.enum.ENTITY_AND_FORM);

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

        await selectFromComboBoxWithAsync({
            nameComboBox: /entity type/i,
            nameOption: /ET 1/i,
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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalledWith({
                name: 'name',
                description: 'description',
                mission_type: MissionTypeValueEnum.enum.ENTITY_AND_FORM,
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
                `${baseUrls.missionsDetails}/id/2`,
            );
        });
    });
    it('submits the data and redirect - MISSION_ORG_UNIT', async () => {
        act(() => {
            renderCreate();
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await switchMissionType(MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM);

        await act(async () => {
            await userEvent.clear(
                screen.getByRole('textbox', { name: /min cardinality/i }),
            );
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

        await selectFromComboBoxWithAsync({
            nameComboBox: /org unit type/i,
            nameOption: /OUT 1/i,
        });
        await act(async () => {
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
                    name: MESSAGES.create.defaultMessage,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: MESSAGES.create.defaultMessage,
                }),
            );
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalledWith({
                name: 'name',
                description: 'description',
                mission_type: MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM,
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
                `${baseUrls.missionsDetails}/id/2`,
            );
        });
    });

    it('redirects to list view if cancel button is clicked', async () => {
        act(() => {
            renderCreate();
        });

        expect(
            screen.getByRole('link', { name: MESSAGES.cancel.defaultMessage }),
        ).toHaveAttribute('href', `/${baseUrls.missions}/`);
    });

    it('goes back to mission list when top bar back button is clicked', async () => {
        act(() => {
            renderCreate();
        });

        await act(async () => {
            await userEvent.click(screen.getByTestId('ArrowBackIcon'));
        });

        await waitFor(() => {
            expect(mockRedirectTo).toHaveBeenCalledWith(baseUrls.missions);
        });
    });
});
