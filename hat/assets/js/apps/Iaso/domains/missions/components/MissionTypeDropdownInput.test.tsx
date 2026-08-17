import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormikProps } from 'formik';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsMissionTypesDropdownListMockHandler,
    getApiMicroplanningMissionsMissionTypesDropdownListResponseMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { MissionTypeDropdownInput } from './MissionTypeDropdownInput';

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

const createProps = (overrides = {}) => ({
    label: 'Mission type',
    field: {
        name: 'mission_type',
        value: MissionTypeValueEnum.enum.FORM_FILLING,
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ mission_type: string }>> as FormikProps<{
        mission_type: string;
    }>,
    ...overrides,
});

describe('MissionTypeDropdownInput test', () => {
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
            <MissionTypeDropdownInput {...createProps()} />,
        );

        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('does not call API if user does not have permissions', async () => {
        mockUserHasPermission.mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <MissionTypeDropdownInput {...createProps()} />,
        );
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(mockCallApi).not.toHaveBeenCalled();
    });

    it('renders input with correct options', async () => {
        const data =
            getApiMicroplanningMissionsMissionTypesDropdownListResponseMock();
        expect(data?.length).toBeGreaterThan(0);

        server.use(
            getCustomApiMicroplanningMissionsMissionTypesDropdownListMockHandler(
                data,
            ),
        );

        renderWithThemeAndIntlProvider(
            <MissionTypeDropdownInput {...createProps()} />,
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
            <MissionTypeDropdownInput {...createProps()} />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
