import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const useGetPipelineConfig = () => {
    return useSnackQuery<
        {
            configured: boolean;
            lqas_pipeline_code?: string;
            connection_name?: string;
        },
        DjangoError
    >({
        queryKey: ['pipelineConfig'],
        queryFn: () => getRequest('/api/openhexa/pipelines/config/'),
        dispatchOnError: false,
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
