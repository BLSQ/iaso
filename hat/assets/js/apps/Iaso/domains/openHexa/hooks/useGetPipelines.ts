import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { DropdownOptions } from 'Iaso/types/utils';
import { Pipeline } from '../types/pipeline';

export const useGetPipelines = (
    enabled = true,
): UseQueryResult<Pipeline[], DjangoError> => {
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
            enabled,
        },
    });
};

export const useGetPipelinesDropdown = (
    enabled = true,
): UseQueryResult<DropdownOptions<string>[], DjangoError> => {
    return useSnackQuery({
        queryKey: ['pipelines-dropdown'],
        queryFn: () => getRequest('/api/openhexa/pipelines/'),
        dispatchOnError: false,
        options: {
            select: data =>
                data?.results?.map(pipeline => ({
                    label: pipeline.name,
                    value: pipeline.id,
                })) ?? [],
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
            enabled,
        },
    });
};
