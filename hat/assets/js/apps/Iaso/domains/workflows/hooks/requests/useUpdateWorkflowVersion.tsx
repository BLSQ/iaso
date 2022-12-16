import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { Status } from '../../types/workflows';

type QueryData = {
    name?: string;
    status?: Status;
};

const updateWorkflowVersion = async (
    data: QueryData,
    versionId: string,
): Promise<any> => patchRequest(`/api/workflowversions/${versionId}/`, data);

export const useUpdateWorkflowVersion = (
    invalidateQueryKey: string,
    versionId: string,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: (data: QueryData) => updateWorkflowVersion(data, versionId),
        invalidateQueryKey: [invalidateQueryKey],
    });
