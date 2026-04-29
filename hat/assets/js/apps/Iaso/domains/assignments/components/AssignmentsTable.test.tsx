import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { baseUrls } from 'Iaso/constants/urls';
import { PaginatedPlanningOrgUnit } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { AssignmentsTable } from './AssignmentsTable';

const captureTableProps = vi.fn();

vi.mock('Iaso/components/tables/TableWithDeepLink', () => ({
    TableWithDeepLink: (props: Record<string, unknown>) => {
        captureTableProps(props);
        return <div data-testid="assignments-table" />;
    },
}));

const mockUseGetPlanningOrgUnitsChildrenPaginated = vi.fn();

vi.mock('Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits', () => ({
    tableDefaults: { limit: 20, page: 1, order: '-name' },
    useGetPlanningOrgUnitsChildrenPaginated: (
        planningId?: number,
        params?: unknown,
    ) => mockUseGetPlanningOrgUnitsChildrenPaginated(planningId, params),
}));

const minimalPlanning = {
    id: 7,
    name: 'Plan',
    forms: [] as number[],
    pipeline_uuids: [] as string[],
    assignments_count: 0,
};

const defaultParams = {
    planningId: '7',
    tab: 'list' as const,
    pageSize: '20',
    page: '1',
};

describe('AssignmentsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetPlanningOrgUnitsChildrenPaginated.mockReturnValue({
            data: {
                results: [
                    { id: 1, name: 'OU 1', assignment: null },
                ] as PaginatedPlanningOrgUnit[],
                count: 1,
                pages: 1,
                limit: 20,
            },
            isLoading: false,
        });
    });

    it('passes org unit rows and pagination from the query into the table', () => {
        renderWithThemeAndIntlProvider(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign
                handleSaveAssignment={vi.fn()}
                isSaving={false}
            />,
        );

        expect(mockUseGetPlanningOrgUnitsChildrenPaginated).toHaveBeenCalledWith(
            7,
            defaultParams,
        );

        expect(captureTableProps).toHaveBeenCalled();
        const tableProps = captureTableProps.mock.calls[0][0] as {
            data: PaginatedPlanningOrgUnit[];
            count: number;
            pages: number;
            baseUrl: string;
            params: typeof defaultParams;
        };

        expect(tableProps.baseUrl).toBe(baseUrls.assignments);
        expect(tableProps.params).toEqual(defaultParams);
        expect(tableProps.data).toEqual([
            { id: 1, name: 'OU 1', assignment: null },
        ]);
        expect(tableProps.count).toBe(1);
        expect(tableProps.pages).toBe(1);
        expect(screen.getByTestId('assignments-table')).toBeVisible();
    });

    it('sets loading when the query is loading or a save is in progress', () => {
        mockUseGetPlanningOrgUnitsChildrenPaginated.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        const { rerender } = renderWithThemeAndIntlProvider(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign
                handleSaveAssignment={vi.fn()}
                isSaving={false}
            />,
        );

        expect(
            (captureTableProps.mock.calls.at(-1)?.[0] as { extraProps: { loading: boolean } })
                .extraProps.loading,
        ).toBe(true);

        mockUseGetPlanningOrgUnitsChildrenPaginated.mockReturnValue({
            data: {
                results: [],
                count: 0,
                pages: 0,
                limit: 20,
            },
            isLoading: false,
        });

        rerender(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign
                handleSaveAssignment={vi.fn()}
                isSaving
            />,
        );

        expect(
            (captureTableProps.mock.calls.at(-1)?.[0] as { extraProps: { loading: boolean } })
                .extraProps.loading,
        ).toBe(true);
    });

    it('passes onRowClick when the user can assign, and omits it otherwise', () => {
        const handleSave = vi.fn();

        const { rerender } = renderWithThemeAndIntlProvider(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign
                handleSaveAssignment={handleSave}
                isSaving={false}
            />,
        );

        const propsWithClick = captureTableProps.mock.calls.at(-1)?.[0] as {
            onRowClick?: (row: PaginatedPlanningOrgUnit) => void;
        };
        expect(propsWithClick.onRowClick).toEqual(expect.any(Function));
        propsWithClick.onRowClick?.({ id: 99, name: 'X', assignment: null });
        expect(handleSave).toHaveBeenCalledWith(99);

        rerender(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign={false}
                handleSaveAssignment={handleSave}
                isSaving={false}
            />,
        );

        const propsNoClick = captureTableProps.mock.calls.at(-1)?.[0] as {
            onRowClick?: (row: PaginatedPlanningOrgUnit) => void;
        };
        expect(propsNoClick.onRowClick).toBeUndefined();
    });

    it('forwards selection props through extraProps', () => {
        const selectedUser = {
            id: 1,
            username: 'a',
            first_name: 'A',
            last_name: 'B',
            color: '#000',
            iaso_profile_id: 1,
        };
        const selectedTeam = { id: 2, name: 'T', color: '#fff' };

        renderWithThemeAndIntlProvider(
            <AssignmentsTable
                planning={minimalPlanning}
                params={defaultParams}
                canAssign={false}
                handleSaveAssignment={vi.fn()}
                isSaving={false}
                selectedUser={selectedUser}
                selectedTeam={selectedTeam}
            />,
        );

        const extra = (
            captureTableProps.mock.calls.at(-1)?.[0] as {
                extraProps: {
                    canAssign: boolean;
                    selectedUser: typeof selectedUser;
                    selectedTeam: typeof selectedTeam;
                };
            }
        ).extraProps;

        expect(extra.canAssign).toBe(false);
        expect(extra.selectedUser).toEqual(selectedUser);
        expect(extra.selectedTeam).toEqual(selectedTeam);
    });
});
