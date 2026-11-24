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
import {
    ApiValidationWorkflowsListParams,
    ValidationWorkflowList,
} from 'Iaso/api/validationWorkflows';
import {
    getApiValidationWorkflowsDestroyMockHandler,
    getApiValidationWorkflowsDuplicateCreateMockHandler,
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
const mockDuplicate = vi.fn();

const HEADING = 'Validation workflows';

const malariaCheck: ValidationWorkflowList = {
    slug: 'malaria-check',
    name: 'Malaria check',
    form_count: 1,
    linked_forms_count: 1,
    steps: [
        {
            slug: 'data-entry',
            name: 'Data entry',
            roles_required: [{ id: 1, name: 'Data manager' }],
        },
        { slug: 'final-approval', name: 'Final approval', roles_required: [] },
    ],
    created_by: 'Alice',
    updated_by: 'Bob',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
};

const vaccinationReview: ValidationWorkflowList = {
    slug: 'vaccination-review',
    name: 'Vaccination review',
    form_count: 0,
    linked_forms_count: 0,
    steps: [],
    created_by: 'Carol',
    updated_by: null,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
};

const listResponse = (results: ValidationWorkflowList[]) =>
    getApiValidationWorkflowsListResponseMock({
        count: results.length,
        has_next: false,
        has_previous: false,
        limit: 20,
        pages: 1,
        page: 1,
        results,
    });

const handlers = [
    getApiValidationWorkflowsListMockHandler(),
    getApiValidationWorkflowsDestroyMockHandler(async info => {
        mockDelete(info.params);
        throw new HttpResponse(null, { status: 204 });
    }),
    getApiValidationWorkflowsDuplicateCreateMockHandler(async info => {
        mockDuplicate(info.params);
        return { slug: 'malaria-check-copy', name: 'Malaria check (copy)' };
    }),
];

const server = setupServer(...handlers);

const previousDefaults = TestingQueryClient.getDefaultOptions();

const renderList = () =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <ValidationWorkflowsConfiguration />
        </MemoryRouter>,
    );

const waitForLoaded = () =>
    waitFor(() => {
        expect(screen.queryByRole('progressbar')).toBeNull();
    });

const openRowMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await act(async () => {
        await user.click(screen.getByRole('button', { name: 'More actions' }));
    });
};

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
        renderList();

        expect(
            screen.getByRole('heading', { name: HEADING }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
        expect(screen.queryByText('No result')).toBeNull();
    });

    it("displays no results when there isn't any", async () => {
        server.use(getApiValidationWorkflowsListMockHandler(listResponse([])));
        renderList();

        expect(
            screen.getByRole('heading', { name: HEADING }),
        ).toBeInTheDocument();
        await waitForLoaded();
        expect(screen.getByText('No result')).toBeInTheDocument();
    });

    it('displays the description of the page', () => {
        renderList();

        expect(
            screen.getByText(/A workflow sets the validation steps/),
        ).toBeInTheDocument();
    });

    it('displays results correctly', async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler(
                listResponse([malariaCheck, vaccinationReview]),
            ),
        );
        renderList();
        await waitForLoaded();

        expect(screen.getByText('2 result(s)')).toBeInTheDocument();

        // Name cell: link to the workflow and number of linked forms
        expect(
            screen.getByRole('link', { name: 'Malaria check' }),
        ).toHaveAttribute(
            'href',
            '/validation-workflows/configuration/detail/slug/malaria-check',
        );
        expect(screen.getByText('1 form linked')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Vaccination review' }),
        ).toBeInTheDocument();
        expect(screen.getByText('No form linked')).toBeInTheDocument();

        // Steps cell: number of steps, then each step by its roles, or its name without roles
        expect(screen.getByText('2 steps')).toBeInTheDocument();
        expect(
            screen.getByText('Data manager → Final approval'),
        ).toBeInTheDocument();
        expect(screen.getByText('No step')).toBeInTheDocument();

        // Last updated cell: last editor, or the creator when never updated
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Carol')).toBeInTheDocument();
        expect(screen.queryByText('Alice')).toBeNull();
    });

    it('displays the row actions only with the permission', async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler(
                listResponse([malariaCheck]),
            ),
        );
        mockUserHasOneOfPermissions.mockReturnValue(true);

        const { rerender } = renderList();
        await waitForLoaded();

        expect(
            screen.getByRole('columnheader', { name: 'Action(s)' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
            'href',
            '/validation-workflows/configuration/detail/slug/malaria-check',
        );
        expect(
            screen.getByRole('button', { name: 'More actions' }),
        ).toBeInTheDocument();

        mockUserHasOneOfPermissions.mockReturnValue(false);
        rerender(
            <MemoryRouter>
                <ValidationWorkflowsConfiguration />
            </MemoryRouter>,
        );
        await waitForLoaded();

        expect(screen.getByText('1 result(s)')).toBeInTheDocument();
        expect(
            screen.queryByRole('columnheader', { name: 'Action(s)' }),
        ).toBeNull();
        expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'More actions' }),
        ).toBeNull();
    });

    it('calls delete upon confirming', async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler(
                listResponse([malariaCheck]),
            ),
        );
        const user = userEvent.setup();
        mockUserHasOneOfPermissions.mockReturnValue(true);

        renderList();
        await waitForLoaded();

        await openRowMenu(user);
        await act(async () => {
            await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
        });

        const modal = await screen.findByRole('dialog');
        expect(within(modal).getByText(/delete workflow/i)).toBeInTheDocument();

        await act(async () => {
            await user.click(
                within(modal).getByRole('button', { name: /yes/i }),
            );
        });

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'malaria-check' }),
            );
        });
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('duplicates a workflow from the row menu', async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler(
                listResponse([malariaCheck]),
            ),
        );
        const user = userEvent.setup();
        mockUserHasOneOfPermissions.mockReturnValue(true);

        renderList();
        await waitForLoaded();

        await openRowMenu(user);
        await act(async () => {
            await user.click(
                screen.getByRole('menuitem', { name: 'Duplicate' }),
            );
        });

        await waitFor(() => {
            expect(mockDuplicate).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'malaria-check' }),
            );
        });
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
        server.use(
            getApiValidationWorkflowsListMockHandler(async info => {
                mockList(info);
                return listResponse([malariaCheck]);
            }),
        );
        const user = userEvent.setup();

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

        // The filters are edited in a drawer, opened from the filter bar
        await act(async () => {
            await user.click(
                screen.getByRole('button', { name: 'Add filters' }),
            );
        });
        await act(async () => {
            await user.type(
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
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /apply/i }));
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
            screen.getByRole('link', { name: 'Create workflow' }),
        ).toHaveAttribute(
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
            screen.getByRole('heading', { name: HEADING }),
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
            screen.getByRole('heading', { name: HEADING }),
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
            screen.getByRole('heading', { name: HEADING }),
        ).toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
