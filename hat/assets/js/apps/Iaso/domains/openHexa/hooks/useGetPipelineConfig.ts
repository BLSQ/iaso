import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const useGetPipelineConfig = () => {
    return useSnackQuery<{ configured: boolean }, DjangoError, boolean>({
        queryKey: ['pipelineConfig'],
        queryFn: () => getRequest('/api/openhexa/pipelines/config/'),
        dispatchOnError: false,
        options: {
            select: data => Boolean(data?.configured),
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
