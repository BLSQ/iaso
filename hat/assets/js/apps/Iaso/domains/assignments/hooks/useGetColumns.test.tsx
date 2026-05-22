import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssignmentCell } from '../components/AssignmentCell';
import { useGetColumns } from './useGetColumns';

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

describe('useGetColumns', () => {
    it('returns id, name, and assignment columns with expected accessors', () => {
        const { result } = renderHook(() => useGetColumns());

        expect(result.current).toHaveLength(3);
        expect(result.current[0]).toMatchObject({
            Header: 'Id',
            accessor: 'id',
            sortable: false,
        });
        expect(result.current[1]).toMatchObject({
            Header: 'Name',
            accessor: 'name',
            sortable: false,
        });
        expect(result.current[2]).toMatchObject({
            Header: 'Assignment',
            accessor: 'assignment',
            sortable: false,
            Cell: AssignmentCell,
        });
    });
});
