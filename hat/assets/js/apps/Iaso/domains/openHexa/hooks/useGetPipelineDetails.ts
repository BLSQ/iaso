import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetPipelineDetails = (pipelineId: string) => {
    return useSnackQuery({
        queryKey: ['pipeline', pipelineId],
        queryFn: () => getRequest(`/api/openhexa/pipelines/${pipelineId}/`),
        options: {
            enabled: Boolean(pipelineId),
        },
    });
};
