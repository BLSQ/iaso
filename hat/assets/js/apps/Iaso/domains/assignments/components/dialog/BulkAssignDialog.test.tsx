import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { BulkAssignDialog } from './BulkAssignDialog';

const mockMutateAsync = vi.fn();
const mockUseGetPlanningOrgUnitsChildrenPaginated = vi.fn();

vi.mock('../../hooks/requests/useSaveAssignment', () => ({
    useBulkSaveAssignments: () => ({
        mutateAsync: mockMutateAsync,
        isLoading: false,
    }),
}));

vi.mock('Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits', () => ({
    useGetPlanningOrgUnitsChildrenPaginated: (
        planningId?: string,
        params?: unknown,
    ) => mockUseGetPlanningOrgUnitsChildrenPaginated(planningId, params),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (
                msg: { defaultMessage?: string; id?: string },
                values?: Record<string, string>,
            ) => {
                let text = msg.defaultMessage ?? msg.id ?? '';
                if (values) {
                    Object.entries(values).forEach(([key, value]) => {
                        text = text.replace(`{${key}}`, value);
                    });
                }
                return text;
            },
        }),
        Table: ({
            data,
            setTableSelection,
        }: {
            data: PlanningOrgUnits[];
            setTableSelection: (
                selectionType: string,
                items: PlanningOrgUnits[],
            ) => void;
        }) => (
            <div data-testid="bulk-assign-table">
                {data.map(row => (
                    <button
                        key={row.id}
                        type="button"
                        onClick={() => setTableSelection('single', [row])}
                    >
                        {row.name}
                    </button>
                ))}
            </div>
        ),
    };
});

const planning = {
    id: 42,
    name: 'Planning',
    target_org_unit_type_details: [{ id: 2, name: 'Area' }],
} as any;

const selectedParentOrgUnit = {
    id: 100,
    name: 'Zone A',
} as PlanningOrgUnits;

describe('BulkAssignDialog', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockMutateAsync.mockResolvedValue(undefined);
        mockUseGetPlanningOrgUnitsChildrenPaginated.mockReturnValue({
            data: {
                results: [{ id: 1, name: 'HF 1', assignment: null }],
                count: 1,
                pages: 1,
            },
            isLoading: false,
        });
    });

    it('renders the dialog title and org unit rows', () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
                selectedUser={{
                    id: 5,
                    username: 'john',
                    first_name: 'John',
                    last_name: 'Doe',
                    color: '#000',
                    iaso_profile_id: 1,
                }}
            />,
        );

        expect(
            screen.getByText('Assign all Area in Zone A'),
        ).toBeInTheDocument();
        expect(screen.getByText('HF 1')).toBeInTheDocument();
    });

    it('enables assign when select-all is active by default', () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
            />,
        );

        expect(screen.getByRole('button', { name: 'Assign' })).toBeEnabled();
    });

    it('disables assign after unselecting all rows', () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Unselect all' }));

        expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
    });

    it('submits bulk assignment and closes the dialog', async () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
                selectedTeam={{ id: 9, name: 'Team', color: '#fff' }}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
        fireEvent.click(screen.getByRole('button', { name: 'Assign' }));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    planning: 42,
                    team: 9,
                    org_unit_parent_id: 100,
                    select_all: true,
                }),
            );
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('calls onClose when cancel is clicked', () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onClose).toHaveBeenCalled();
    });
});
