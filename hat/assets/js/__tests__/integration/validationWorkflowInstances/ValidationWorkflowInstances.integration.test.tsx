import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import moment from 'moment/moment';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect } from 'vitest';
import { ValidationWorkflowInstanceSearch } from 'Iaso/domains/validationWorkflowInstances';
import { apiDateTimeFormat } from 'Iaso/utils/dates';
import { SUBMISSION_VALIDATION_WORKFLOW } from 'Iaso/utils/featureFlags';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
import { currentUserFactory } from '../../factories/users';

const { mockUseGetValidationWorkflowInstanceSearch } = vi.hoisted(() => {
    return { mockUseGetValidationWorkflowInstanceSearch: vi.fn() };
});

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});
const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetFormsDropdownOptions: vi.fn() };
});
const { mockUseGetWorkflowOptions } = vi.hoisted(() => {
    return { mockUseGetWorkflowOptions: vi.fn() };
});

vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));
vi.mock('Iaso/domains/validationWorkflowsConfiguration/api/Get', () => ({
    useGetWorkflowOptions: mockUseGetWorkflowOptions,
}));
vi.mock(
    'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceSearch',
    () => ({
        useGetValidationWorkflowInstanceSearch:
            mockUseGetValidationWorkflowInstanceSearch,
    }),
);

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
        const currentUser = currentUserFactory.build({
            is_superuser: false,
            permissions: [VALIDATION_WORKFLOWS],
            account: {
                id: 22,
                feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            },
        });
        mockCurrentUser.mockReturnValue(currentUser);
        mockUseGetFormsDropdownOptions.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseGetWorkflowOptions.mockReturnValue({
            data: null,
            isFetching: false,
        });
    });

    it('displays a spinner while loading', async () => {
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue({
            data: null,
            isLoading: true,
        });

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <ValidationWorkflowInstanceSearch />
            </MemoryRouter>,
        );
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });
    it('displays the data correctly', async () => {
        const date = moment(Date.now()).format(apiDateTimeFormat);
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValue({
            data: {
                count: 1,
                has_next: false,
                has_previous: false,
                limit: 1,
                page: 1,
                pages: 1,
                results: [
                    {
                        id: 1,
                        form: { id: 1, name: 'Some form' },
                        project: {
                            id: 1,
                            name: 'some project',
                            color: '#bbbbbb',
                        },
                        general_validation_status: 'APPROVED',
                        user_has_been_involved: true,
                        requires_user_action: true,
                        last_updated: date,
                    },
                ],
            },
            isFetching: false,
        });

        await act(async () => {
            renderWithThemeAndIntlProvider(
                <MemoryRouter>
                    <ValidationWorkflowInstanceSearch />
                </MemoryRouter>,
            );
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('APPROVED')).toBeVisible();
        expect(screen.getByText('some project')).toBeVisible();
        expect(screen.getByText('Some form')).toBeVisible();

        expect(
            screen.getByText(
                moment(date, apiDateTimeFormat).format('DD/MM/YYYY HH:mm'),
            ),
        ).toBeVisible();

        // But can you tell me which data you'd need to construct your dashboard ? might be worth having a dedicated
    });
    it('displays the right icons', async () => {
        const date = moment(Date.now()).format(apiDateTimeFormat);
        mockUseGetValidationWorkflowInstanceSearch.mockReturnValueOnce({
            data: {
                count: 1,
                has_next: false,
                has_previous: false,
                limit: 1,
                page: 1,
                pages: 1,
                results: [
                    {
                        id: 1,
                        form: { id: 1, name: 'Some form' },
                        project: {
                            id: 1,
                            name: 'some project',
                            color: '#bbbbbb',
                        },
                        general_validation_status: 'APPROVED',
                        user_has_been_involved: true,
                        requires_user_action: true,
                        last_updated: date,
                    },
                ],
            },
            isFetching: false,
        });

        await act(async () => {
            renderWithThemeAndIntlProvider(
                <MemoryRouter>
                    <ValidationWorkflowInstanceSearch />
                </MemoryRouter>,
            );
        });

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();
        expect(screen.getByTestId('PendingActionsIcon')).toBeInTheDocument();
        expect(screen.getByTestId('RemoveRedEyeIcon')).toBeInTheDocument();
        expect(
            screen.getByTestId('RemoveRedEyeIcon').parentElement,
        ).toHaveAttribute(
            'href',
            `/forms/submission/referenceFormId/1/instanceId/1/accountId/22/`,
        );
    });
});
