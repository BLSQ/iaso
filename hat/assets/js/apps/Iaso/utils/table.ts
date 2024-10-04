import {
    selectionInitialState,
    setTableSelection,
} from 'bluesquare-components';
import React, { useCallback, useMemo, useState } from 'react';
import { Selection } from '../domains/orgUnits/types/selection';
import { useObjectState } from '../hooks/useObjectState';
import { PaginationParams } from '../types/general';

type UseTableSelection<T> = {
    selection: Selection<T>;
    setSelection: React.Dispatch<React.SetStateAction<Selection<T>>>;
    handleTableSelection: (
        selectionType: any,
        items?: Array<any>,
        totalCount?: number,
    ) => void;
    handleSelectAll: (items?: Array<any>, totalCount?: number) => void;
    handleUnselectAll: () => void;
};

/** Convenience hook when using the built-in select boxes of a Table
 * @prop count: number (optional) - Should be passed when using a custom "edit selected" button (i.o. the tables speed dial) so the hook is made aware of the total number of selectable elements
 */
export const useTableSelection = <T>(count?: number): UseTableSelection<T> => {
    const [selection, setSelection] = useState<Selection<T>>(
        selectionInitialState,
    );
    const defaultCount = count ?? 0;
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = defaultCount) => {
            const newSelection: Selection<T> = setTableSelection(
                selection,
                selectionType,
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [defaultCount, selection],
    );

    const handleSelectAll = useCallback(
        (data: Array<T>, items = [], totalCount = defaultCount) => {
            const newSelection: Selection<T> = setTableSelection(
                data,
                'selectAll',
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [defaultCount],
    );

    const handleUnselectAll = useCallback(() => {
        const newSelection = setTableSelection([], 'reset');
        setSelection(newSelection);
    }, [setSelection]);

    return useMemo(() => {
        return {
            selection,
            setSelection,
            handleTableSelection,
            handleSelectAll,
            handleUnselectAll,
        };
    }, [handleSelectAll, handleTableSelection, handleUnselectAll, selection]);
};

const defaultInitialState: PaginationParams = {
    order: '-updated_at',
    page: '1',
    pageSize: '10',
};

type TableState = {
    params: PaginationParams;
    onTableParamsChange: (newParams: PaginationParams) => void;
};
export const useTableState = (initialState?: PaginationParams): TableState => {
    const [tableState, setTableState] = useObjectState(
        initialState ?? defaultInitialState,
    );

    const onTableParamsChange = useCallback(
        (newParams: PaginationParams) => setTableState(newParams),
        [setTableState],
    );

    return useMemo(() => {
        return { params: tableState, onTableParamsChange };
    }, [onTableParamsChange, tableState]);
};
