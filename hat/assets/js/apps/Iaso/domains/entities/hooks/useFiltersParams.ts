import { Column, getSort } from 'bluesquare-components';

import { defaultSorted, useStaticColumns } from '../config';

import { Filters, Params } from '../types/filters';

export const useFiltersParams = (): ((
    params: Params,
    filters: Filters,
) => Params) => {
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
