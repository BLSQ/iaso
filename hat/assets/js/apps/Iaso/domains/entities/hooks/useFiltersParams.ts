import {
    // @ts-ignore
    getSort,
} from 'bluesquare-components';

import { useStaticColumns, defaultSorted } from '../config';

import { Column } from '../../../types/table';
import { Filters, Params } from '../types/filters';

export const useFiltersParams = (): ((
    // eslint-disable-next-line no-unused-vars
    params: Params,
    // eslint-disable-next-line no-unused-vars
    filters: Filters,
) => void) => {
    const staticColumns: Array<Column> = useStaticColumns();
    const getParams = (params: Params, filters: Filters): Params => {
        const tempParams = {
            ...params,
            ...filters,
        };
        // reset order to avoid order by non existing columns if type changed an order is using a dynamic key
        if (
            filters.entityTypeIds !== params.entityTypeIds &&
            params.order &&
            !staticColumns.find(col => col.id && params.order.includes(col.id))
        ) {
            tempParams.order = getSort(defaultSorted);
        }
        tempParams.page = '1';
        return tempParams;
    };
    return getParams;
};
