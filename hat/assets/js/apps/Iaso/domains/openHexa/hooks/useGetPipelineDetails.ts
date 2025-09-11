import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetPipelineDetails = (pipelineId: string) => {
    return useSnackQuery({
        queryKey: ['pipeline', pipelineId],
        queryFn: () => getRequest(`/api/openhexa/pipelines/${pipelineId}/`),
        options: {
            enabled: Boolean(pipelineId),
            select: data => {
                if (!data) return undefined;
                return {
                    ...data,
                    currentVersion: {
                        ...data.currentVersion,
                        parameters: data.currentVersion?.parameters.filter(
                            parameter =>
                                parameter.code !== 'task_id' &&
                                parameter.code !== 'pipeline_id',
                        ),
                    },
                };
            },
        },
    });
};
