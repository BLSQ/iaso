import { UseMutationResult } from 'react-query';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../constants';

export const deleteWorkflow = (id: number) => deleteRequest(`${API_URL}${id}/`);

export const useDeleteWorkflow = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: deleteWorkflow,
        invalidateQueryKey: ['submission-workflow'],
    });
};
