import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssignmentCell } from '../table/AssignmentCell';
import { useGetBulkAssignColumns } from './useGetBulkAssignColumns';

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { id: string; defaultMessage?: string }) =>
                msg.defaultMessage ?? msg.id,
        }),
    };
});

describe('useGetBulkAssignColumns', () => {
    it('returns name and assignment columns when there is a single target type', () => {
        const { result } = renderHook(() => useGetBulkAssignColumns(false));

        expect(result.current).toHaveLength(2);
        expect(result.current[0]).toMatchObject({
            Header: 'Name',
            accessor: 'name',
        });
        expect(result.current[1]).toMatchObject({
            Header: 'Assignment',
            accessor: 'assignment',
            sortable: false,
            Cell: AssignmentCell,
        });
    });

    it('inserts an org unit type column when there are multiple target types', () => {
        const { result } = renderHook(() => useGetBulkAssignColumns(true));

        expect(result.current).toHaveLength(3);
        expect(result.current[0]).toMatchObject({
            Header: 'Name',
            accessor: 'name',
        });
        expect(result.current[1]).toMatchObject({
            Header: 'Org unit type',
            accessor: 'org_unit_type__name',
        });
        expect(result.current[2]).toMatchObject({
            Header: 'Assignment',
            accessor: 'assignment',
            Cell: AssignmentCell,
        });
    });
});
