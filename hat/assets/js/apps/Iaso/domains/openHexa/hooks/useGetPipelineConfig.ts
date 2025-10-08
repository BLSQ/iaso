import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const useGetPipelineConfig = () => {
    return useSnackQuery<
        {
            configured: boolean;
            lqas_pipeline_code?: string;
            connection_host: string;
            connection_token: string;
        },
        DjangoError
    >({
        queryKey: ['pipelineConfig'],
        queryFn: async () => {
            const config = await getRequest('/api/openhexa/pipelines/config/');
            const connection_token = await getRequest('/api/apitoken/').then(
                data => data.token,
            );
            const connection_host = window.location.origin;
            return {
                ...config,
                connection_host,
                connection_token: connection_token || '',
            };
        },
        dispatchOnError: false,
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
