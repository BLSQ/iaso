import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
const launchTask = async (body, pipelineId, version) => {
    return postRequest(`/api/openhexa/pipelines/${pipelineId}/`, {
        config: body,
        version,
    });
};
export const useLaunchTask = (pipelineId: string, version: string) => {
    return useSnackMutation({
        mutationFn: body => launchTask(body, pipelineId, version),
        invalidateQueryKey: 'pipeline',
    });
};
