import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const useGetPipelineDetails = (
    pipelineId: string,
    setError: (error: DjangoError | null) => void,
) => {
    return useSnackQuery({
        queryKey: ['pipeline', pipelineId],
        queryFn: () => getRequest(`/api/openhexa/pipelines/${pipelineId}/`),
        dispatchOnError: false,
        options: {
            enabled: Boolean(pipelineId),
            select: data => {
                if (!data) return undefined;
                setError(null);
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
            retry: false,
            onError: error => {
                setError(error);
            },
        },
    });
};
