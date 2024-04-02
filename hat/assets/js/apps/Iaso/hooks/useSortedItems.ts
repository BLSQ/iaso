import { Column } from 'bluesquare-components';
import { get, orderBy } from 'lodash';
import { useMemo } from 'react';

type SortOrder = 'asc' | 'desc';
type Sort = {
    sortKey: string;
    sortOrder: SortOrder;
};

export const useSortedItems = <T>(
    items: T[] | undefined,
    columns: Column[],
    order: string,
): T[] | undefined => {
    const { sortKey, sortOrder } = useMemo<Sort>(() => {
        const isDescending = order.startsWith('-');
        const key = isDescending ? order.substring(1) : order;
        return {
            sortKey: key,
            sortOrder: isDescending ? 'desc' : 'asc',
        };
    }, [order]);

    const columnAccessor: string | undefined = useMemo(() => {
        return columns?.find(item => item.id === sortKey)?.accessor as
            | string
            | undefined;
    }, [sortKey, columns]);

    return useMemo(
        () =>
            columnAccessor
                ? orderBy(
                      items,
                      [item => get(item, columnAccessor)],
                      [sortOrder],
                  )
                : items,
        [items, columnAccessor, sortOrder],
    );
};
