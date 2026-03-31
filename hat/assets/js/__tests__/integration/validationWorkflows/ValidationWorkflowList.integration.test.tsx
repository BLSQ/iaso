import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, describe } from 'vitest';
import { SubmissionValidation } from 'Iaso/domains/instances/validationWorkflow/SubmissionValidation';
import { ValidationWorkflowListResponseItem } from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithTheme } from '../../../tests/helpers';
import { currentUserFactory } from '../../factories/users';
import { validationWorkflowListFactory } from '../../factories/validationWorkflows/validationWorkflow';

// mock components
vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
    };
});

// mock hooks
const { mockUseGetSubmissionValidationWorkflows } = vi.hoisted(() => {
    return { mockUseGetSubmissionValidationWorkflows: vi.fn() };
});

const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetFormsDropdownOptions: vi.fn() };
});

const { mockUseDeleteWorkflow } = vi.hoisted(() => {
    return { mockUseDeleteWorkflow: vi.fn() };
});

vi.mock('Iaso/domains/instances/validationWorkflow/api/Get', () => ({
    useGetSubmissionValidationWorkflows:
        mockUseGetSubmissionValidationWorkflows,
}));

vi.mock('Iaso/domains/instances/validationWorkflow/api/Delete', () => ({
    useDeleteWorkflow: () => ({
        mutationFn: mockUseDeleteWorkflow,
        mutateAsync: mockUseDeleteWorkflow,
    }),
}));

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

describe('Validation workflow list UI integration test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: null,
            isFetching: false,
        });
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('displays a spinner while loading', async () => {
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: null,
            isFetching: true,
        });

        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        waitFor(
            () => {
                expect(
                    screen.getByRole('heading', {
                        name: 'Configure validation of submissions',
                    }),
                ).toBeInTheDocument();
                expect(screen.queryByText('No result')).toBeNull();
                expect(
                    screen.getByTestId('loading-spinner'),
                ).toBeInTheDocument();
            },
            { timeout: 2000 },
        );
    });

    it("displays no results when there isn't any", () => {
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: null,
            isFetching: false,
        });

        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
        expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });

    it('displays results correctly', async () => {
        const validationWorkFlows = validationWorkflowListFactory.build();
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: validationWorkFlows,
            isFetching: false,
        });
        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );
        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText('2 result(s)')).toBeInTheDocument();

        validationWorkFlows.results.forEach(
            (validationWorkflow: ValidationWorkflowListResponseItem) => {
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
                    screen.getByText(validationWorkflow.form_count),
                ).toBeInTheDocument();
            },
        );
    });

    it('displays edit and delete button if superuser or has permission', async () => {
        const validationWorkFlows = validationWorkflowListFactory.build(
            {},
            { transient: { resultsLength: 1 } },
        );
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: validationWorkFlows,
            isFetching: false,
        });
        let currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValueOnce(currentUser);

        const { rerender } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText('1 result(s)')).toBeInTheDocument();

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();

        expect(screen.getByRole('link', { name: '' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '' })).toHaveAttribute(
            'href',
            `/forms/submissions/validation/detail/slug/${validationWorkFlows?.results?.[0]?.slug}`,
        );

        expect(
            screen.getByTestId('SettingsIcon').parentElement,
        ).toHaveAttribute(
            'href',
            `/forms/submissions/validation/detail/slug/${validationWorkFlows?.results?.[0]?.slug}`,
        );

        currentUser = currentUserFactory.build({
            is_superuser: false,
            permissions: [VALIDATION_WORKFLOWS],
        });
        mockCurrentUser.mockReturnValueOnce(currentUser);

        rerender(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText('1 result(s)')).toBeInTheDocument();

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();
    });

    it('calls delete upon confirming', async () => {
        mockUseDeleteWorkflow.mockResolvedValue(true);

        const validationWorkFlows = validationWorkflowListFactory.build(
            {},
            { transient: { resultsLength: 1 } },
        );
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: validationWorkFlows,
            isFetching: false,
        });
        const userEventStp = userEvent.setup();
        const currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValue(currentUser);
        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();

        expect(screen.queryByText('No result')).toBeNull();

        expect(screen.getByText('1 result(s)')).toBeInTheDocument();

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();

        act(() => {
            userEventStp.click(screen.getByTestId('DeleteIcon'));
        });

        const modal = await screen.findByRole('dialog');
        expect(modal).toBeInTheDocument();

        expect(screen.getByText(/delete workflow/i)).toBeInTheDocument();

        const saveButton = within(modal).getByRole('button', { name: /yes/i });
        act(() => {
            userEventStp.click(saveButton);
        });

        await waitFor(() => {
            expect(mockUseDeleteWorkflow).toHaveBeenCalledWith(
                validationWorkFlows?.results?.[0]?.slug,
            );
        });

        expect(screen.queryByRole('dialog')).toBeNull();
    });

    // with zod and orval ;)
    it.todo('search with the right parameters');

    it('has a create button', () => {
        renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('link', { name: 'Create' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute(
            'href',
            '/forms/submissions/validation/detail/',
        );

        // it shouldn't be disabled as the router handles the perm there
    });
});

// todo : fix bluequare-components SearchInput IA-4930 + links + ...
describe.todo('Validation workflow list accessibility', () => {
    beforeAll(() => {
        vi.clearAllMocks();
        const currentUser = currentUserFactory.build({ is_superuser: true });
        mockCurrentUser.mockReturnValue(currentUser);
    });

    it('has no accessibility violations', async () => {
        const validationWorkFlows = validationWorkflowListFactory.build();
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: validationWorkFlows,
            isFetching: false,
            error: null,
        });

        const { container } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText('No result')).toBeNull();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when fetching', async () => {
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: null,
            isFetching: true,
            error: null,
        });

        const { container } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText('No result')).toBeNull();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when no results', async () => {
        mockUseGetSubmissionValidationWorkflows.mockReturnValue({
            data: null,
            isFetching: false,
            error: null,
        });

        const { container } = renderWithTheme(
            <MemoryRouter>
                <IntlProvider locale={'en'}>
                    <SubmissionValidation />
                </IntlProvider>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', {
                name: 'Configure validation of submissions',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
