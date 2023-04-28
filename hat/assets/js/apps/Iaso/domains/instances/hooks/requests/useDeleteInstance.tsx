import { UseMutationResult } from 'react-query';
import { deleteRequest, patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteInstance = async (instanceId: string): Promise<any> => {
    return deleteRequest(`/api/instances/${instanceId}/`);
};
export const useDeleteInstance = (
    invalidateQueryKey = 'instance',
): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteInstance,
        invalidateQueryKey,
    });

const restoreInstance = async (instanceId: string): Promise<any> =>
    patchRequest(`/api/instances/${instanceId}/`, { deleted: false });

export const useRestoreInstance = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: restoreInstance,
        invalidateQueryKey: 'instance',
        showSucessSnackBar: true,
    });
