import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { AssignmentsProvider } from '../../contexts/AssignmentsContext';
import { BulkAssignDialog } from './BulkAssignDialog';

const mockMutateAsync = vi.fn();
const mockUseGetPlanningOrgUnitsChildrenPaginated = vi.fn();

vi.mock('Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits', () => ({
    useGetPlanningOrgUnitsChildrenPaginated: (
        planningId?: string,
        params?: unknown,
    ) => mockUseGetPlanningOrgUnitsChildrenPaginated(planningId, params),
}));

vi.mock('Iaso/domains/teams/hooks/requests/useSaveTeam', () => ({
    useSaveTeam: () => ({ mutate: vi.fn() }),
}));

vi.mock('Iaso/domains/users/hooks/useSaveProfile', () => ({
    useSaveProfile: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../hooks/requests/useSaveAssignment', () => ({
    useSaveAssignment: () => ({
        handleSaveAssignment: vi.fn(),
        isLoading: false,
    }),
    useBulkSaveAssignments: () => ({
        mutateAsync: mockMutateAsync,
        isLoading: false,
    }),
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
            formatNumber: (value: number) => value.toString(),
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

const planningWithMultipleTargets = {
    id: 42,
    name: 'Planning',
    target_org_unit_type_details: [
        { id: 2, name: 'Area' },
        { id: 3, name: 'Health Centre' },
    ],
} as any;

const orgUniTypeList = [
    { value: 2, label: 'Area' },
    { value: 3, label: 'Health Centre' },
];

const selectedParentOrgUnit = {
    id: 100,
    name: 'Zone A',
} as PlanningOrgUnits;

const selectedUser = {
    id: 5,
    username: 'john',
    first_name: 'John',
    last_name: 'Doe',
    color: '#000',
    iaso_profile_id: 1,
};

const selectedTeam = { id: 9, name: 'Team', color: '#fff' };

const onClose = vi.fn();

const renderBulkAssignDialog = (
    dialogProps: Partial<React.ComponentProps<typeof BulkAssignDialog>> = {},
    providerProps: React.ComponentProps<typeof AssignmentsProvider> = {
        planningId: '42',
    },
) =>
    renderWithThemeAndIntlProvider(
        <AssignmentsProvider {...providerProps}>
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planning}
                {...dialogProps}
            />
        </AssignmentsProvider>,
    );

describe('BulkAssignDialog', () => {
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
        renderBulkAssignDialog(
            {},
            { planningId: '42', initialSelectedUser: selectedUser },
        );

        expect(
            screen.getByText('Assign all Area in Zone A'),
        ).toBeInTheDocument();
        expect(screen.getByText('HF 1')).toBeInTheDocument();
    });

    it('enables assign when select-all is active by default', () => {
        renderBulkAssignDialog();

        expect(screen.getByRole('button', { name: 'Assign' })).toBeEnabled();
    });

    it('disables assign after unselecting all rows', () => {
        renderWithThemeAndIntlProvider(
            <BulkAssignDialog
                open
                onClose={onClose}
                selectedParentOrgUnit={selectedParentOrgUnit}
                planning={planningWithMultipleTargets}
                orgUniTypeList={orgUniTypeList}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Unselect all' }));

        expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
    });

    it('submits bulk assignment and closes the dialog', async () => {
        renderBulkAssignDialog(
            {},
            { planningId: '42', initialSelectedTeam: selectedTeam },
        );

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
        renderBulkAssignDialog();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onClose).toHaveBeenCalled();
    });
});
