import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';


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
        staleTime: 1000 * 60 * 15, // in MS
        cacheTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });
};
