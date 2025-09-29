import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { Pipeline } from '../types/pipeline';

export const useGetPipelines = (
    setError: (error: DjangoError | null) => void,
): UseQueryResult<Pipeline[], Error> => {
    return useSnackQuery({
        queryKey: ['pipelines'],
        queryFn: () => getRequest('/api/openhexa/pipelines/'),
        dispatchOnError: false,
        options: {
            select: data => data?.results ?? [],
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
            onError: error => {
                setError(error);
            },
        },
    });
};
