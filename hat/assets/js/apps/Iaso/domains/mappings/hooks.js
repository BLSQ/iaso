import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import { useRedirectToReplace } from 'bluesquare-components';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls.ts';
import { useApiParams } from '../../hooks/useApiParams';

const defaultTimes = {
    staleTime: 1000 * 60 * 15, // in MS
    cacheTime: 1000 * 60 * 5,
};
const defaultQueryParams = {};
export const useGetMappingVersions = params => {
    if (params.formId) {
        params.form_id = params.formId;
    }
    const queryString = new URLSearchParams(
        useApiParams(params, defaultQueryParams),
    );
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
        mutationFn: payload => {
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

export const useGetMappingVersionDetail = mappingVersionId => {
    return useSnackQuery({
        queryKey: ['mappingversions', mappingVersionId],
        queryFn: async () => {
            const mappingVersion = await getRequest(
                `/api/mappingversions/${mappingVersionId}.json?fields=:all`,
            );
            const formVersionId = mappingVersion.form_version.id;
            const formVersion = await getRequest(
                `/api/formversions/${formVersionId}.json?fields=:all`,
            );
            return { mappingVersion, formVersion };
        },
        ...defaultTimes,
    });
};

export const useApplyUpdate = () => {
    return useSnackMutation({
        mutationFn: ({ mappingVersionId, payload }) => {
            return patchRequest(
                `/api/mappingversions/${mappingVersionId}/`,
                payload,
            );
        },
        invalidateQueryKey: ['mappingversions'],
        snackErrorMsg: MESSAGES.fetchMappingsError,
    });
};

export const useApplyPartialUpdate = () => {
    return useSnackMutation({
        mutationFn: ({ mappingVersionId, questionName, mapping }) => {
            return patchRequest(`/api/mappingversions/${mappingVersionId}/`, {
                question_mappings: {
                    [questionName]: mapping,
                },
            });
        },
        invalidateQueryKey: ['mappingversions'],
        snackErrorMsg: MESSAGES.fetchMappingsError,
    });
};
