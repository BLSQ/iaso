import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteStockMovement = (id: number) =>
    deleteRequest(`/api/stock/movements/${id}/`);

export const useDeleteStockMovement = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deleteStockMovement,
        invalidateQueryKey: ['stockMovements'],
    });
};
