import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { axe } from 'jest-axe';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { IntlProvider } from 'react-intl';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { expect, describe, vi } from 'vitest';
import { ApiValidationWorkflowsListParams } from 'Iaso/api/validationWorkflows';
import {
    getApiValidationWorkflowsDestroyMockHandler,
    getApiValidationWorkflowsListMockHandler,
    getApiValidationWorkflowsListResponseMock,
} from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidationWorkflowsConfiguration } from 'Iaso/domains/validationWorkflowsConfiguration';
import {
    renderWithTheme,
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
    TestingQueryClient,
} from '../../../tests/helpers';

// mock components
vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
    };
});

// mock hooks

const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetFormsDropdownOptions: vi.fn() };
});

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));

const { mockUserHasOneOfPermissions } = vi.hoisted(() => {
    return { mockUserHasOneOfPermissions: vi.fn() };
});

vi.mock('Iaso/domains/users/utils', async () => {
    const actual = await vi.importActual('Iaso/domains/users/utils');
    return {
        ...actual,
        userHasOneOfPermissions: mockUserHasOneOfPermissions,
    };
});

const mockDelete = vi.fn();

const handlers = [
    getApiValidationWorkflowsListMockHandler(),
    getApiValidationWorkflowsDestroyMockHandler(async info => {
        mockDelete(info.params);
        throw new HttpResponse(null, { status: 204 });
    }),
];

const server = setupServer(...handlers);

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Validation workflow list UI integration test', () => {
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
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('displays a spinner while loading', async () => {
        vi.stubEnv('MSW_DELAY', '1000000');
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
        expect(screen.queryByText('No result')).toBeNull();
    });

    it("displays no results when there isn't any", async () => {
        const data = getApiValidationWorkflowsListResponseMock({
            count: 0,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
            results: [],
        });
        server.use(getApiValidationWorkflowsListMockHandler(data));

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.getByText('No result')).toBeInTheDocument();
    });

    it('displays results correctly', async () => {
        const data = getApiValidationWorkflowsListResponseMock({
            count: 6,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });

        expect(data?.results?.length ?? 0).toBeGreaterThan(0);
        server.use(getApiValidationWorkflowsListMockHandler(data));

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );
        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
            expect(screen.queryByText('No result')).toBeNull();
        });

        expect(screen.getByText(`${data.count} result(s)`)).toBeInTheDocument();

        screen.logTestingPlaygroundURL();
        data?.results?.forEach(validationWorkflow => {
            expect(
                screen.getByText(validationWorkflow.name),
            ).toBeInTheDocument();

            const expectedValues = [
                validationWorkflow.created_by,
                validationWorkflow.updated_by,
            ].filter(Boolean);

            expectedValues.forEach(value => {
                expect(screen.getByText(String(value))).toBeInTheDocument();
            });
            expect(
                screen.getByText(
                    validationWorkflow.form_count.toLocaleString(),
                ),
            ).toBeInTheDocument();
        });
    });

    it('displays edit and delete button if superuser or has permission', async () => {
        const returnData = getApiValidationWorkflowsListResponseMock({
            count: 6,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });

        const data = {
            ...returnData,
            count: 1,
            results: returnData?.results?.slice(0, 1),
        };

        server.use(getApiValidationWorkflowsListMockHandler(data));

        expect(data?.results?.length).toBe(1);

        mockUserHasOneOfPermissions.mockReturnValue(true);

        const { rerender } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.queryByText('No result')).toBeNull();

        expect(
            screen.getByText(`${data?.count} result(s)`),
        ).toBeInTheDocument();

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();

        expect(screen.getByRole('link', { name: '' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '' })).toHaveAttribute(
            'href',
            `/validation-workflows/configuration/detail/slug/${data?.results?.[0]?.slug}`,
        );

        expect(
            screen.getByTestId('SettingsIcon').parentElement,
        ).toHaveAttribute(
            'href',
            `/validation-workflows/configuration/detail/slug/${data?.results?.[0]?.slug}`,
        );

        mockUserHasOneOfPermissions.mockReturnValue(false);

        rerender(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText('1 result(s)')).toBeInTheDocument();

        expect(screen.queryByTestId('DeleteIcon')).toBeNull();
        expect(screen.queryByTestId('SettingsIcon')).toBeNull();
    });

    it('calls delete upon confirming', async () => {
        const returnData = getApiValidationWorkflowsListResponseMock({
            count: 6,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });

        const data = {
            ...returnData,
            count: 1,
            results: returnData?.results?.slice(0, 1),
        };

        server.use(getApiValidationWorkflowsListMockHandler(data));

        expect(data?.results?.length).toBe(1);

        const userEventStp = userEvent.setup();
        mockUserHasOneOfPermissions.mockReturnValue(true);

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText(`${data.count} result(s)`)).toBeInTheDocument();

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();

        await act(async () => {
            await userEventStp.click(screen.getByTestId('DeleteIcon'));
        });

        const modal = await screen.findByRole('dialog');
        expect(modal).toBeInTheDocument();

        expect(screen.getByText(/delete workflow/i)).toBeInTheDocument();

        const saveButton = within(modal).getByRole('button', { name: /yes/i });
        await act(async () => {
            await userEventStp.click(saveButton);
        });

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith(
                expect.objectContaining({ slug: data?.results?.[0]?.slug }),
            );
        });

        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('uses the correct parameters for searching', async () => {
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [
                { value: 1, label: 'form 1' },
                { value: 2, label: 'form 2' },
                { value: 3, label: 'form 3' },
            ],
            isLoading: false,
            isFetching: false,
        });
        const mockList = vi.fn();
        const data = getApiValidationWorkflowsListResponseMock({
            count: 6,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });

        server.use(
            getApiValidationWorkflowsListMockHandler(async _info => {
                mockList(_info);
                return getApiValidationWorkflowsListResponseMock(data);
            }),
        );

        renderWithThemeAndIntlProvider(
            <MemoryRouter
                initialEntries={[
                    `/${baseUrls.validationWorkflowsConfiguration}/accountId/1/`,
                ]}
            >
                <Routes>
                    <Route
                        path={`/${baseUrls.validationWorkflowsConfiguration}/*`}
                        element={<ValidationWorkflowsConfiguration />}
                    ></Route>
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
            expect(mockList).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /search/i }),
                'something',
            );
        });
        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /forms/i,
                nameOption: 'form 1',
            });
        });

        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /forms/i,
                nameOption: 'form 2',
            });
        });
        const searchButton = screen.getByTestId('search-button');
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

        expect(url.searchParams.get('name')).toBe('something');
        expect(url.searchParams.get('forms')).toBe('1,2');

        const raw = Object.fromEntries(url.searchParams.entries());

        const params = {
            ...raw,
            forms: raw.forms?.split(',').map(Number),
            limit: raw.limit ? Number(raw.limit) : undefined,
            page: raw.page ? Number(raw.page) : undefined,
        };

        expect(() =>
            ApiValidationWorkflowsListParams.parse(params),
        ).not.toThrow();
    });

    it('has a create button', () => {
        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <ValidationWorkflowsConfiguration />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('link', { name: 'Create' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute(
            'href',
            '/validation-workflows/configuration/detail/',
        );
    });
});

// todo : fix bluequare-components SearchInput IA-4930 + links + ...
describe.todo('Validation workflow list accessibility', () => {
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
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('has no accessibility violations', async () => {
        const data = getApiValidationWorkflowsListResponseMock({
            count: 6,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });

        expect(data?.results?.length ?? 0).toBeGreaterThan(0);
        server.use(getApiValidationWorkflowsListMockHandler(data));

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText('No result')).toBeNull();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when fetching', async () => {
        vi.stubEnv('MSW_DELAY', '1000000');

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText('No result')).toBeNull();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when no results', async () => {
        const data = getApiValidationWorkflowsListResponseMock({
            count: 0,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
            results: [],
        });
        server.use(getApiValidationWorkflowsListMockHandler(data));

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <ValidationWorkflowsConfiguration />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation workflows',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
