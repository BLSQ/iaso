import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, describe } from 'vitest';
import { SubmissionValidation } from 'Iaso/domains/instances/validationWorkflow/SubmissionValidation';
import { ValidationWorkflowListResponseItem } from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { renderWithTheme } from '../../../tests/helpers';
import { validationWorkflowListFactory } from '../../factories/validationWorkflows/validationWorkflow';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
    };
});

const { mockUseGetSubmissionValidationWorkflows } = vi.hoisted(() => {
    return { mockUseGetSubmissionValidationWorkflows: vi.fn() };
});

const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetFormsDropdownOptions: vi.fn() };
});

vi.mock('Iaso/domains/instances/validationWorkflow/api/Get', () => ({
    useGetSubmissionValidationWorkflows:
        mockUseGetSubmissionValidationWorkflows,
}));

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));

describe('Validation workflow list UI integration test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('displays a spinner while loading', () => {
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

        waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Configure validation of submissions',
                }),
            ).toBeInTheDocument();
            expect(screen.queryByText('No result')).toBeNull();
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });
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
});

// todo : fix bluequare-components SearchInput IA-4930
describe.todo('Validation workflow list accessibility', () => {
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
