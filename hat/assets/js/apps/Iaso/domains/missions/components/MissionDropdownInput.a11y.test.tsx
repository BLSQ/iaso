import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { FormikProps } from 'formik';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsDropdownListMockHandler,
    getApiMicroplanningMissionsDropdownListResponseMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { MissionDropdownInput } from './MissionDropdownInput';

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

const getCustomApiMicroplanningMissionsDropdownListMockHandler = (
    overrideResponse?: Parameters<
        typeof getApiMicroplanningMissionsDropdownListMockHandler
    >[0],
    options?: Parameters<
        typeof getApiMicroplanningMissionsDropdownListMockHandler
    >[1],
) => {
    mockCallApi();
    return getApiMicroplanningMissionsDropdownListMockHandler(
        overrideResponse,
        options,
    );
};

const server = setupServer(
    getCustomApiMicroplanningMissionsDropdownListMockHandler(),
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

describe('MissionDropdownInput a11y test', () => {
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
            <MissionDropdownInput {...createProps()} />,
        );

        expect(screen.queryByRole('combobox')).toBeNull();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('does not have a11y violation if it renders input with correct options', async () => {
        const data = getApiMicroplanningMissionsDropdownListResponseMock();
        expect(data?.length).toBeGreaterThan(0);

        server.use(
            getCustomApiMicroplanningMissionsDropdownListMockHandler(data),
        );

        const { container } = renderWithThemeAndIntlProvider(
            <MissionDropdownInput {...createProps()} />,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.getByRole('combobox')).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });

    // loading spinner not a11y
    it.skip('renders loading state', async () => {
        vi.stubEnv('MSW_DELAY', '1_000_000');
        const { container } = renderWithThemeAndIntlProvider(
            <MissionDropdownInput {...createProps()} />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });
});
