import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import { useRedirectToReplace } from 'bluesquare-components';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls.ts';

const defaultTimes = {
    staleTime: 1000 * 60 * 15, // in MS
    cacheTime: 1000 * 60 * 5,
};

export const useGetMappingVersions = params => {
    const queryParams = {
        order: params.order,
        limit: params.pageSize,
        page: params.page,
    };

    if (params.formId) {
        queryParams['form_id'] = params.formId;
    }

    const queryString = new URLSearchParams(queryParams);

    return useSnackQuery({
        queryKey: ['mappingversions', params],
        queryFn: () =>
            getRequest(`/api/mappingversions/?${queryString.toString()}`),

        keepPreviousData: true,
        ...defaultTimes,
    });
};

export const useCreateMappingMutation = params => {
    const redirectToReplace = useRedirectToReplace();

    return useSnackMutation({
        mutationFn: (payload) => {
            return postRequest('/api/mappingversions/', payload);
        },
        invalidateQueryKey: ['mappingversions'],
        snackErrorMsg: MESSAGES.fetchMappingsError,
        options: {
            onSuccess: result => {
                redirectToReplace(baseUrls.mappingDetail, {
                    mappingVersionId: result.id,
                });
            },
        },
    });
};

export const useDataSources = () => {
    return useSnackQuery({
        queryKey: ['mappingversions'],
        queryFn: () => getRequest('/api/datasources/').then(r => r.sources),
        keepPreviousData: true,
        ...defaultTimes,
    });
};
