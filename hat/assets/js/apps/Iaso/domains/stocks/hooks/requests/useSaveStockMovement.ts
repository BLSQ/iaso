import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export type SaveStockMovementQuery = {
    stock_item: number;
    org_unit: number;
    quantity: number;
};

const endpoint = '/api/stock/movements/';

export const useSaveStockMovement = (): UseMutationResult => {
    const ignoreErrorCodes = [400];
    return useSnackMutation({
        mutationFn: (data: SaveStockMovementQuery) =>
            postRequest(endpoint, data),
        invalidateQueryKey: ['stockMovements'],
        ignoreErrorCodes,
    });
};