import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { getCookie } from 'Iaso/utils/cookies';

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

            // Automatically set connection_host and connection_token
            const connection_host = window.location.origin;
            const connection_token = getCookie('sessionid');

            if (!connection_token) {
                console.warn(
                    'No sessionid cookie found. Pipeline authentication may fail.',
                );
            }

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
