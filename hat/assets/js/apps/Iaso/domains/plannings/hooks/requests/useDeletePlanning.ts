import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { endpoint } from '../../constants';

const deletePlanning = (id: number) => deleteRequest(`${endpoint}${id}/`);

export const useDeletePlanning = (
    onSuccess?: () => void,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deletePlanning,
        invalidateQueryKey: ['planningsList'],
        options: {
            onSuccess,
        },
    });
};
