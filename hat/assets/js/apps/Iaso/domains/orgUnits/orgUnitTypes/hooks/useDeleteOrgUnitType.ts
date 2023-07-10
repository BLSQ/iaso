import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteOrgUnitType = (id: number) =>
    deleteRequest(`/api/v2/orgunittypes/${id}/`);

export const useDeleteOrgUnitType = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deleteOrgUnitType,
        invalidateQueryKey: ['paginated-orgunit-types'],
    });
};
