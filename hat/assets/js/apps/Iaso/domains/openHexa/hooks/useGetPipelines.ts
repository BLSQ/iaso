import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { Pipeline } from '../types/pipeline';

export const useGetPipelines = (): UseQueryResult<Pipeline[], Error> => {
    return useSnackQuery({
        queryKey: ['pipelines'],
        queryFn: () => getRequest('/api/openhexa/pipelines/'),
        options: {
            select: data => data?.results ?? [],
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
