import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
const launchTask = async (body, pipelineId, version) => {
    return postRequest(`/api/openhexa/pipelines/${pipelineId}/launch/`, {
        config: body,
        version,
    });
};
export const useLaunchTask = (pipelineId?: string, version?: string) => {
    return useSnackMutation({
        mutationFn: body => {
            if (!pipelineId || !version) {
                throw new Error('Pipeline ID and version are required');
            }
            return launchTask(body, pipelineId, version);
        },
        invalidateQueryKey: 'pipeline',
    });
};
