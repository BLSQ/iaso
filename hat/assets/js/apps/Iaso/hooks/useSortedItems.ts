import { Column } from 'bluesquare-components';
import { get, orderBy } from 'lodash';
import { useMemo } from 'react';

type SortOrder = 'asc' | 'desc';

export const useSortedItems = <T>(
    items: T[] | undefined,
    columns: Column[],
    order: string,
): T[] | undefined => {
    const isDescending = order.startsWith('-');
    const sortKey = isDescending ? order.substring(1) : order;
    const sortOrder: SortOrder = isDescending ? 'desc' : 'asc';
    const columnAccessor: string | undefined = columns?.find(
        item => item.id === sortKey,
    )?.accessor;

    return useMemo(() => {
        return columnAccessor
            ? orderBy(items, [item => get(item, columnAccessor)], [sortOrder])
            : items;
    }, [items, columnAccessor, sortOrder]);
};
