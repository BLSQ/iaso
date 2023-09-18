import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { StocksMovementPaginated, StocksParams } from '../types/stocks';

const getStocksMovements = async (
    options: StocksParams,
): Promise<StocksMovementPaginated> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
    const url = makeUrlWithParams('/api/stock/movements', params);
    return getRequest(url) as Promise<StocksMovementPaginated>;
};

export const useGetStocksMouvements = (
    options: StocksParams,
): UseQueryResult<StocksMovementPaginated, Error> => {
    const queryKey: any[] = ['stockMovements', options];
    return useSnackQuery(
        queryKey,
        () => getStocksMovements(options),
        undefined,
    );
};
