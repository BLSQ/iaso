import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import moment from 'moment/moment';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect } from 'vitest';
import { ValidationWorkflowInstances } from 'Iaso/domains/validationWorkflowInstances';
import { ValidationWorkflowInstanceListResponseItem } from 'Iaso/domains/validationWorkflowInstances/types';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
import { currentUserFactory } from '../../factories/users';

const {
    mockUseGetValidationWorkflowInstanceSearch,
    mockUseGetValidationWorkflowInstanceCounts,
    mockCurrentUser,
    mockUseGetFormsDropdownOptions,
    mockUseGetProjectsDropdownOptions,
    mockUseApiValidationWorkflowsDropdownList,
} = vi.hoisted(() => ({
    mockUseGetValidationWorkflowInstanceSearch: vi.fn(),
    mockUseGetValidationWorkflowInstanceCounts: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockUseGetFormsDropdownOptions: vi.fn(),
    mockUseGetProjectsDropdownOptions: vi.fn(),
    mockUseApiValidationWorkflowsDropdownList: vi.fn(),
}));

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));
vi.mock('Iaso/domains/projects/hooks/requests', async () => {
    const actual = await vi.importActual(
        'Iaso/domains/projects/hooks/requests',
    );
    return {
        ...actual,
        useGetProjectsDropdownOptions: mockUseGetProjectsDropdownOptions,
    };
});
vi.mock(
    'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows',
    async () => {
        const actual = await vi.importActual(
            'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows',
        );
        return {
            ...actual,
            useApiValidationWorkflowsDropdownList:
                mockUseApiValidationWorkflowsDropdownList,
        };
    },
);
vi.mock(
    'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceSearch',
    () => ({
        useGetValidationWorkflowInstanceSearch:
            mockUseGetValidationWorkflowInstanceSearch,
        useGetValidationWorkflowInstanceCounts:
            mockUseGetValidationWorkflowInstanceCounts,
    }),
);
vi.mock('Iaso/utils/usersUtils', async () => {
    const actual = await vi.importActual('Iaso/utils/usersUtils');
    return {
        ...actual,
        useCurrentUser: mockCurrentUser,
    };
});

const counts = {
    all: 181,
    awaiting_my_action: 12,
    awaiting_others: 34,
    handled_by_me: 128,
    rejected: 7,
    oldest_pending_since: null,
};

const item: ValidationWorkflowInstanceListResponseItem = {
    id: 1,
    display_name: 'FAC-2026-0412',
    form: { id: 1, name: 'Some form' },
    workflow: { id: 2, name: 'Some workflow' },
    org_unit: {
        id: 1,
        name: 'some org unit',
        parent: { id: 2, name: 'some parent' },
    },
    project: { id: 1, name: 'some project', color: '#bbbbbb' },
    general_validation_status: 'Pending',
    validation_status: 'PENDING',
    user_has_been_involved: false,
    requires_user_action: true,
    handled_by_me: false,
    last_updated: null,
    pending_since: moment().subtract(3, 'days').toISOString(),
    submitted_by: {
        id: 3,
        username: 'jmbala',
        first_name: 'Jean',
        last_name: 'Mbala',
    },
    submitted_at: moment().subtract(3, 'days').toISOString(),
    is_resubmission: false,
    current_steps: [
        {
            id: 100,
            node_template_id: 10,
            name: 'District validation',
            position: 1,
            pending_since: moment().subtract(3, 'days').toISOString(),
            user_can_act: true,
        },
    ],
    step_count: 2,
    last_user_action: null,
};

const searchResponse = {
    data: {
        count: 1,
        has_next: false,
        has_previous: false,
        limit: 20,
        page: 1,
        pages: 1,
        results: [item],
    },
    isFetching: false,
};

const renderPage = async () => {
    await act(async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowInstances />
            </MemoryRouter>,
        );
    });
};

describe('Validation queue UI integration test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser.mockReturnValue(
            currentUserFactory.build({
                is_superuser: false,
                permissions: [VALIDATION_WORKFLOWS],
                account: {
                    id: 22,
                    modules: [VALIDATION_WORKFLOW_MODULE],
                },
            }),
        );
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseGetProjectsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseApiValidationWorkflowsDropdownList.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseGetValidationWorkflowInstanceCounts.mockReturnValue({
            data: counts,
            isLoading: false,
        });
    });

    it('displays a spinner while loading', async () => {
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue({
            data: undefined,
            isFetching: true,
        });

        await renderPage();

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    it('displays the queue counts', async () => {
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue(
            searchResponse,
        );

        await renderPage();

        expect(screen.getByTestId('queue-tile-all')).toHaveTextContent(
            'All181',
        );
        expect(
            screen.getByTestId('queue-tile-awaiting_my_action'),
        ).toHaveTextContent('Awaiting my action12');
        expect(screen.getByTestId('queue-tile-rejected')).toHaveTextContent(
            'Rejected7',
        );
    });

    it('displays the submissions', async () => {
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue(
            searchResponse,
        );

        await renderPage();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(
            screen.getByRole('link', { name: 'Some form — FAC-2026-0412' }),
        ).toBeVisible();
        expect(screen.getByText('some org unit')).toBeVisible();
        expect(screen.getByText('some parent')).toBeVisible();
        expect(screen.getByText('Jean Mbala')).toBeVisible();
        expect(screen.getByText('District validation')).toBeVisible();
        expect(screen.getByText('Waiting on you · 3 days')).toBeVisible();
    });

    it('links the review action to the submission validation page', async () => {
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue(
            searchResponse,
        );

        await renderPage();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(
            screen.getByTestId('FactCheckIcon').closest('a'),
        ).toHaveAttribute(
            'href',
            '/forms/submission/referenceFormId/1/instanceId/1/accountId/22/isValidating/true/',
        );
    });
});
