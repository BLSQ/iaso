import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PaginatedValidationWorkflowListList } from 'Iaso/api/validationWorkflows';
import {
    getApiValidationWorkflowsDestroyMockHandler,
    getApiValidationWorkflowsListMockHandler,
    getApiValidationWorkflowsListResponseMock,
    getValidationWorkflowsMock,
} from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows.msw';
import { axe } from 'jest-axe';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, describe } from 'vitest';
import { SubmissionValidation } from 'Iaso/domains/instances/validationWorkflow/SubmissionValidation';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import {
    renderWithTheme,
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';
import { currentUserFactory } from '../../factories/users';

const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetFormsDropdownOptions: vi.fn() };
});

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', async () => {
    const actual = await vi.importActual('Iaso/utils/usersUtils');
    return {
        ...actual,
        useCurrentUser: mockCurrentUser,
    };
});

const mockDeleteWorkflow = vi.fn();

const customMockHandlers = {
    // @ts-ignore
    destroy: getApiValidationWorkflowsDestroyMockHandler(async info => {
        mockDeleteWorkflow(info.params.slug);
        return new HttpResponse(null, { status: 204 });
    }),
};

const server = setupServer(...getValidationWorkflowsMock());

// just an helper to get the right faker seed for your usage
// eslint-disable-next-line
const getSeedFor = ({
    condition,
}: {
    condition: (data: PaginatedValidationWorkflowListList) => boolean;
}): void => {
    let validationWorkFlows;
    for (let seed = 1; seed < 10_000_000; seed++) {
        faker.seed(seed);

        validationWorkFlows = getApiValidationWorkflowsListResponseMock();

        const ok = condition(validationWorkFlows);

        if (ok) {
            // eslint-disable-next-line
            console.log('number', seed);
            break;
        }
    }
};

type WithResults = PaginatedValidationWorkflowListList & {
    results: NonNullable<PaginatedValidationWorkflowListList['results']>;
};

describe('Validation workflow list UI integration test', () => {
    beforeAll(() => {
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
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        // reset faker seed
        faker.seed(Date.now());
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('displays a spinner while loading', async () => {
        vi.stubEnv('MSW_DELAY', '1000000');

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(
                screen.getByRole('heading', {
                    name: 'Configure validation of submissions',
                }),
            ).toBeInTheDocument();
            expect(screen.queryByText('No result')).toBeNull();
        });
    });

    it("displays no results when there isn't any", async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler({ results: undefined }),
        );

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Configure validation of submissions',
                }),
            ).toBeInTheDocument();
            expect(screen.getByText('No result')).toBeInTheDocument();
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
    });

    it('displays results correctly', async () => {
        // setting seed to have deterministic results on the results attribute
        faker.seed(5397);

        const validationWorkFlows = getApiValidationWorkflowsListResponseMock({
            count: 2,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        }) as WithResults;

        expect(validationWorkFlows?.results?.length).toBe(2);

        server.use(
            getApiValidationWorkflowsListMockHandler(validationWorkFlows),
        );

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(
                screen.getByText(
                    `${validationWorkFlows.results.length} result(s)`,
                ),
            ).toBeInTheDocument();
            expect(screen.queryByText('No result')).toBeNull();
        });

        validationWorkFlows.results.forEach(validationWorkflow => {
            expect(
                screen.getByText(validationWorkflow.name),
            ).toBeInTheDocument();
            expect(
                screen.getByText(validationWorkflow.updated_by as string),
            ).toBeInTheDocument();
            expect(
                screen.getByText(validationWorkflow.created_by as string),
            ).toBeInTheDocument();
            expect(
                screen.getByText(
                    validationWorkflow.form_count.toLocaleString(),
                ),
            ).toBeInTheDocument();
        });
    });

    it('displays edit and delete button if superuser or has permission', async () => {
        faker.seed(10);

        const validationWorkFlows = getApiValidationWorkflowsListResponseMock({
            count: 1,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        }) as WithResults;

        expect(validationWorkFlows?.results?.length).toBe(1);

        server.use(
            getApiValidationWorkflowsListMockHandler(validationWorkFlows),
        );

        let currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValue(currentUser);

        const { rerender } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('No result')).toBeNull();

            expect(screen.getByText('1 result(s)')).toBeInTheDocument();
            expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
            expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();
        });

        expect(screen.getByRole('link', { name: '' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '' })).toHaveAttribute(
            'href',
            `/validation/submissions/detail/slug/${validationWorkFlows?.results?.[0]?.slug}`,
        );

        expect(
            screen.getByTestId('SettingsIcon').parentElement,
        ).toHaveAttribute(
            'href',
            `/validation/submissions/detail/slug/${validationWorkFlows?.results?.[0]?.slug}`,
        );

        currentUser = currentUserFactory.build({
            is_superuser: false,
            permissions: [VALIDATION_WORKFLOWS],
        });
        mockCurrentUser.mockReturnValue(currentUser);

        rerender(
            <MemoryRouter>
                <SubmissionValidation />,
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('No result')).toBeNull();

            expect(screen.getByText('1 result(s)')).toBeInTheDocument();
            expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
            expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();
        });
    });

    it('calls delete upon confirming', async () => {
        faker.seed(10);

        const validationWorkFlows = getApiValidationWorkflowsListResponseMock({
            count: 1,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        }) as WithResults;

        expect(validationWorkFlows?.results?.length).toBe(1);

        server.use(
            getApiValidationWorkflowsListMockHandler(validationWorkFlows),
            customMockHandlers.destroy,
        );

        const userEventStp = userEvent.setup();
        const currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValue(currentUser);
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('No result')).toBeNull();

            expect(screen.getByText('1 result(s)')).toBeInTheDocument();
        });

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
            expect(mockDeleteWorkflow).toHaveBeenCalledWith(
                validationWorkFlows?.results?.[0]?.slug,
            );
        });

        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('has a create button', () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('link', { name: 'Create' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute(
            'href',
            '/validation/submissions/detail/',
        );

        // it shouldn't be disabled as the router handles the perm there
    });
});

// todo : fix bluequare-components SearchInput IA-4930 + links + ...
describe.todo('Validation workflow list accessibility', () => {
    beforeAll(() => {
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
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        // reset faker seed
        faker.seed(Date.now());
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
        const currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValue(currentUser);
    });

    it('has no accessibility violations', async () => {
        faker.seed(5397);

        const validationWorkFlows = getApiValidationWorkflowsListResponseMock({
            count: 2,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        }) as WithResults;

        expect(validationWorkFlows?.results?.length).toBe(2);

        server.use(
            getApiValidationWorkflowsListMockHandler(validationWorkFlows),
        );

        const { container } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Configure validation of submissions',
                }),
            ).toBeInTheDocument();
            expect(screen.queryByText('No result')).toBeNull();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when fetching', async () => {
        vi.stubEnv('MSW_DELAY', '1000000');

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <SubmissionValidation />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText('No result')).toBeNull();
            expect(screen.getByRole('progressbar')).toBeVisible();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when no results', async () => {
        server.use(
            getApiValidationWorkflowsListMockHandler({ results: undefined }),
        );

        const { container } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Configure validation of submissions',
                }),
            ).toBeInTheDocument();
            expect(screen.getByText('No result')).toBeInTheDocument();
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
