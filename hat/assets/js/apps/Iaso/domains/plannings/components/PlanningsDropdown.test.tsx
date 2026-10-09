import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    getApiMicroplanningPlanningsDropdownListMockHandler,
    getApiMicroplanningPlanningsDropdownListResponseMock,
} from 'Iaso/api/plannings/endpoints/micro-plannings/micro-plannings.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { PlanningsDropdown } from './PlanningsDropdown';

const { mockCurrentUser, mockUserHasPermission } = vi.hoisted(() => ({
    mockCurrentUser: vi.fn(),
    mockUserHasPermission: vi.fn(),
}));

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

vi.mock('Iaso/domains/users/utils', () => ({
    userHasPermission: mockUserHasPermission,
}));

const mockCallApi = vi.fn();

const server = setupServer(
    getApiMicroplanningPlanningsDropdownListMockHandler(async info => {
        mockCallApi(info);
        return getApiMicroplanningPlanningsDropdownListResponseMock();
    }),
);
const previousDefaults = TestingQueryClient.getDefaultOptions();

const Wrapper = ({
    formIds,
}: {
    formIds?: number[];
} = {}) => {
    const [value, setValue] = React.useState<number | null>(null);

    return (
        <PlanningsDropdown
            keyValue="planningId"
            value={value}
            handleChange={(_key, newValue) => setValue(newValue)}
            formIds={formIds}
        />
    );
};

describe('PlanningsDropdown', () => {
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

    it('does not render the input when the user lacks planning permissions', () => {
        mockUserHasPermission.mockReturnValue(false);

        renderWithThemeAndIntlProvider(<Wrapper />);

        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('does not call the API when the user lacks planning permissions', async () => {
        mockUserHasPermission.mockReturnValue(false);

        renderWithThemeAndIntlProvider(<Wrapper />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByRole('combobox')).toBeNull();
        expect(mockCallApi).not.toHaveBeenCalled();
    });

    it('renders the input with the available planning options', async () => {
        const data = getApiMicroplanningPlanningsDropdownListResponseMock();

        expect(data?.length).toBeGreaterThan(0);

        server.use(getApiMicroplanningPlanningsDropdownListMockHandler(data));

        renderWithThemeAndIntlProvider(<Wrapper />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const combobox = screen.getByRole('combobox');
        expect(combobox).toBeInTheDocument();

        const user = userEvent.setup();

        await act(async () => {
            await user.click(combobox);
        });

        data?.forEach(({ label }) => {
            expect(
                screen.getByRole('option', { name: label }),
            ).toBeInTheDocument();
        });
    });

    it('passes form_ids to the API', async () => {
        renderWithThemeAndIntlProvider(<Wrapper formIds={[10, 20]} />);

        await waitFor(() => {
            const info = mockCallApi.mock.calls[0][0];
            expect(new URL(info.request.url).searchParams.get('form_ids')).toBe(
                '10,20',
            );
        });
    });

    it('renders the loading state', () => {
        vi.stubEnv('MSW_DELAY', '1_000_000');

        renderWithThemeAndIntlProvider(<Wrapper />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('updates the selected value when the user picks a planning', async () => {
        const data = getApiMicroplanningPlanningsDropdownListResponseMock();

        expect(data?.length).toBeGreaterThan(0);

        server.use(getApiMicroplanningPlanningsDropdownListMockHandler(data));

        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<Wrapper />);

        const combobox = screen.getByRole('combobox', { name: 'Planning' });

        await act(async () => {
            await user.click(combobox);
        });
        await act(async () => {
            await user.click(
                await screen.findByRole('option', { name: data?.[0]?.label }),
            );
        });

        await waitFor(() => {
            expect(combobox).toHaveValue(data?.[0]?.label);
        });
    });

    it('clears the selection when the user clears the combobox', async () => {
        const data = getApiMicroplanningPlanningsDropdownListResponseMock();

        expect(data?.length).toBeGreaterThan(0);

        server.use(getApiMicroplanningPlanningsDropdownListMockHandler(data));

        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<Wrapper />);

        const combobox = screen.getByRole('combobox', { name: 'Planning' });

        await act(async () => {
            await user.click(combobox);
        });
        await act(async () => {
            await user.click(
                await screen.findByRole('option', { name: data?.[0]?.label }),
            );
        });

        await waitFor(() => {
            expect(combobox).toHaveValue(data?.[0]?.label);
        });

        await act(async () => {
            await user.clear(combobox);
        });

        await waitFor(() => {
            expect(combobox).toHaveValue('');
        });
    });
});
