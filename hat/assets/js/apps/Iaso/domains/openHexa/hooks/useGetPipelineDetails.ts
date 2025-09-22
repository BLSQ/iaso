import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { Pipeline } from '../types/pipeline';

export const useGetPipelineDetails = (
    pipelineId?: string,
    parameterstoRemove: string[] = ['task_id', 'pipeline_id'],
): UseQueryResult<Pipeline, DjangoError> => {
    return useSnackQuery({
        queryKey: ['pipeline', pipelineId],
        queryFn: () => getRequest(`/api/openhexa/pipelines/${pipelineId}/`),
        dispatchOnError: false,
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
                                !parameterstoRemove.includes(parameter.code),
                        ),
                    },
                };
            },
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
