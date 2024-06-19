import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export const useDeleteRun = (): UseMutationResult<any> => {
    return useSnackMutation({
        mutationFn: runId => deleteRequest(`/api/algorithmsruns/${runId}/`),
        invalidateQueryKey: 'algos',
    });
};
