import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { StocksMovementPaginated, StocksParams } from '../../types/stocks';

const getStockMovements = async (
    options: StocksParams,
): Promise<StocksMovementPaginated> => {
    const { pageSize, stockItem, orgUnitId, page, order } = options;
    const params = {
        limit: pageSize,
        stockitems: stockItem,
        orgunit: orgUnitId,
        page,
        order,
    };
    const url = makeUrlWithParams('/api/stock/movements/', params);
    return getRequest(url) as Promise<StocksMovementPaginated>;
};

export const useGetStockMovements = (
    options: StocksParams,
): UseQueryResult<StocksMovementPaginated, Error> => {
    const queryKey: any[] = ['stockMovements', options];
    return useSnackQuery({
        queryKey,
        queryFn: () => getStockMovements(options),
    });
};
