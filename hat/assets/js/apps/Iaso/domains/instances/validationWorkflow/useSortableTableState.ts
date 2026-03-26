import { useCallback, useMemo, useState } from 'react';
import { useAsyncInitialState } from 'Iaso/hooks/useAsyncInitialState';

export const useSortableTableState = <T>(tableData: T[]) => {
    const [items, setItems] = useAsyncInitialState<T[]>(tableData, true);

    const [isOrderChanged, setIsOrderChanged] = useState<boolean>(false);
    const handleSortChange = useCallback(
        (items: T[]) => {
            setItems(
                items.map((item: T, index: number) => ({
                    ...item,
                    order: index + 1,
                })),
            );
            setIsOrderChanged(true);
        },
        [setItems],
    );
    const handleResetOrder = useCallback(() => {
        setItems(tableData);
        setIsOrderChanged(false);
    }, [setItems, tableData]);

    return useMemo(() => {
        return {
            items: items ?? [],
            setItems,
            isOrderChanged,
            handleSortChange,
            handleResetOrder,
            setIsOrderChanged,
        };
    }, [handleResetOrder, handleSortChange, isOrderChanged, items, setItems]);
};
