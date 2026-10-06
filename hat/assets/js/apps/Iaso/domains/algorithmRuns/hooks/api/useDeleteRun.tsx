import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

export const useDeleteRun = () => {
    return useSnackMutation({
        mutationFn: runId => deleteRequest(`/api/algorithmsruns/${runId}/`),
        invalidateQueryKey: 'algos',
    });
};
