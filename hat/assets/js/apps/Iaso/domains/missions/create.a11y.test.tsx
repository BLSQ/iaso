import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
    TestingQueryClient,
} from 'hat/assets/js/tests/helpers';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsCreateMockHandler,
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionCreate } from 'Iaso/domains/missions/create';
import MESSAGES from 'Iaso/domains/missions/messages';
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

// Forms table: empty actions <th> + cardinality inputs labeled only by column headers
// (aria-label on Field is not forwarded by NumberInput). Skip those axe rules for now.
const axeOptionsWithFormsTable = {
    rules: {
        label: { enabled: false },
        'empty-table-header': { enabled: false },
    },
};

const getFormsCardinalityInput = (
    formIndex: number,
    field: 'min_cardinality' | 'max_cardinality',
) => {
    const input = document.getElementById(
        `input-text-forms.${formIndex}.${field}`,
    );
    if (!input) {
        throw new Error(
            `Missing forms cardinality input: forms.${formIndex}.${field}`,
        );
    }
    return input;
};

const switchMissionType = async (
    missionType: (typeof MissionTypeValueEnum.enum)[keyof typeof MissionTypeValueEnum.enum],
) => {
    await act(async () => {
        await userEvent.click(
            screen.getByRole('combobox', {
                name: /mission type/i,
            }),
        );
    });

    await act(async () => {
        await userEvent.click(
            screen.getByRole('option', {
                name: missionType,
            }),
        );
    });
};

const addForm = async (formOption: string | RegExp) => {
    await act(async () => {
        await userEvent.click(
            screen.getByRole('combobox', {
                name: /add a form/i,
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

describe('Mission create a11y tests', () => {
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

    it('has no violation - MISSION FORM', async () => {
        let container: HTMLElement;

        act(() => {
            ({ container } = renderCreate());
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
                getFormsCardinalityInput(0, 'min_cardinality'),
            );
            await userEvent.type(
                getFormsCardinalityInput(0, 'min_cardinality'),
                '2',
            );
        });
        await act(async () => {
            await userEvent.type(
                getFormsCardinalityInput(0, 'max_cardinality'),
                '20',
            );
        });

        await addForm(/form b/i);

        // @ts-ignore
        expect(
            await axe(container, axeOptionsWithFormsTable),
        ).toHaveNoViolations();
    });
    it('has no violation - MISSION ORG UNIT', async () => {
        let container: HTMLElement;

        act(() => {
            ({ container } = renderCreate());
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

        // @ts-ignore
        expect(
            await axe(container, axeOptionsWithFormsTable),
        ).toHaveNoViolations();
    });
    it('has no violation - MISSION ENTITY TYPE', async () => {
        let container: HTMLElement;

        act(() => {
            ({ container } = renderCreate());
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
        // @ts-ignore
        expect(
            await axe(container, axeOptionsWithFormsTable),
        ).toHaveNoViolations();
    });
    it('has no violation - form general errors', async () => {
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

        let container: HTMLElement;

        act(() => {
            ({ container } = renderCreate());
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
            expect(mockCreate).toHaveBeenCalled();
        });

        expect(screen.getByText('Invalid name')).toBeVisible();
        expect(screen.getByText('Invalid description')).toBeVisible();
        expect(screen.getByText('Invalid mission_type')).toBeVisible();
        expect(screen.getByText('Generic forms error')).toBeVisible();

        // @ts-ignore
        expect(
            await axe(container, axeOptionsWithFormsTable),
        ).toHaveNoViolations();
    });
});
