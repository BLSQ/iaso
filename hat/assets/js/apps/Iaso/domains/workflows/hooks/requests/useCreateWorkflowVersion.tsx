import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

type QueryData = {
    name: string;
    entityTypeId: number;
};

const createWorkflowVersion = async (data: QueryData): Promise<any> => {
    const { entityTypeId, ...params } = data as Record<string, any>;
    params.entity_type_id = entityTypeId;
    return postRequest('/api/workflowversions/', params);
};

export const useCreateWorkflowVersion = (
    closeDialog: () => void,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: createWorkflowVersion,
        invalidateQueryKey: 'workflowVersions',
        options: { onSuccess: () => closeDialog() },
    });
