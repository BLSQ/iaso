import React, { useCallback, useMemo, useState } from 'react';
import {
    selectionInitialState,
    setTableSelection,
} from 'bluesquare-components';
import { redirectToReplace } from '../routing/actions';
import { dispatch } from '../redux/store';
import { Selection } from '../domains/orgUnits/types/selection';

export const handleTableDeepLink = (baseUrl: string) => {
    return newParams => {
        dispatch(redirectToReplace(baseUrl, newParams));
    };
};

type UseTableSelection<T> = {
    selection: Selection<T>;
    setSelection: React.Dispatch<React.SetStateAction<Selection<T>>>;
    handleTableSelection: (
        // eslint-disable-next-line no-unused-vars
        selectionType: any,
        // eslint-disable-next-line no-unused-vars
        items?: Array<any>,
        // eslint-disable-next-line no-unused-vars
        totalCount?: number,
    ) => void;
    handleSelectAll: (
        // eslint-disable-next-line no-unused-vars
        items?: Array<any>,
        // eslint-disable-next-line no-unused-vars
        totalCount?: number,
    ) => void;
    handleUnselectAll: () => void;
};
export const useTableSelection = <T>(): UseTableSelection<T> => {
    const [selection, setSelection] = useState<Selection<T>>(
        selectionInitialState,
    );
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<T> = setTableSelection(
                selection,
                selectionType,
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [selection],
    );

    const handleSelectAll = useCallback(
        (data: Array<T>, items = [], totalCount = 0) => {
            const newSelection: Selection<T> = setTableSelection(
                data,
                'selectAll',
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [setSelection],
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
