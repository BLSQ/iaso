import { UseMutationResult } from 'react-query';
import { TaskApiResponse } from 'Iaso/domains/tasks/types';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

const launchTask = async (body: any, pipelineId: string, version: string) => {
    return postRequest(`/api/openhexa/pipelines/${pipelineId}/launch/`, {
        config: body,
        version,
    });
};

export const useLaunchTask = (
    pipelineId?: string,
    version?: string,
    showSucessSnackBar = true,
): UseMutationResult<TaskApiResponse<any>, DjangoError, any> => {
    return useSnackMutation({
        mutationFn: (body: any) => {
            if (!pipelineId || !version) {
                throw new Error('Pipeline ID and version are required');
            }
            return launchTask(body, pipelineId, version);
        },
        showSucessSnackBar,
        invalidateQueryKey: 'pipeline',
    });
};
