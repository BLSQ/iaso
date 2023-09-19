import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { StockItems } from '../../types/stocks';
import { DropdownOptions } from '../../../../types/utils';

const getStockItems = async (): Promise<StockItems> => {
    return getRequest('/api/stock/items/') as Promise<StockItems>;
};

export const useGetDropdownStockItems = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const queryKey: any[] = ['stockItems'];
    return useSnackQuery({
        queryKey,
        queryFn: () => getStockItems(),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.results.map(stockItem => ({
                    value: `${stockItem.id}`,
                    label: stockItem.name,
                })) || [],
        },
    });
};
