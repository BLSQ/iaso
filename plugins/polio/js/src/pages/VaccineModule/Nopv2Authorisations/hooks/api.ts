import { UseMutationResult, useQueryClient } from 'react-query';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

const listUrl =
    '/api/polio/vaccineauthorizations/get_most_recent_authorizations/';
const baseUrl = '/api/polio/vaccineauthorizations/';

const getVaccineAuthorisationsList = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

export const useGetLatestAuthorisations = params => {
    const safeParams = useUrlParams(params);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: [
            'latest-nopv2-auth',
            apiParams,
            apiParams.page,
            apiParams.limit,
            apiParams.order,
        ],
        queryFn: () => getVaccineAuthorisationsList(apiParams),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
        },
    });
};

const getAuthorisations = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${baseUrl}?${queryString}`);
};

export const useGetAuthorisations = params => {
    const apiParams = useApiParams(params);
    return useSnackQuery({
        queryKey: ['nopv2-auth', params],
        queryFn: () => getAuthorisations(apiParams),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
        },
    });
};

const deleteNopv2Authorisation = authorisationId => {
    return deleteRequest(`${baseUrl}${authorisationId}`);
};

export const useDeleteNopv2Authorisation = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: authoristationId =>
            deleteNopv2Authorisation(authoristationId),
        options: {
            // TODO refactor when useSnackMtation refactor is merged
            onSuccess: () => {
                queryClient.invalidateQueries('nopv2-auth');
                queryClient.invalidateQueries('latest-nopv2-auth');
            },
        },
    });
};

const createEditNopv2Authorisation = body => {
    if (body.id) {
        return patchRequest(`${baseUrl}${body.id}/`, body);
    }
    return postRequest(baseUrl, body);
};

export const useCreateEditNopv2Authorisation = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => createEditNopv2Authorisation(body),
        options: {
            // TODO refactor when useSnackMtation refactor is merged
            onSuccess: () => {
                queryClient.invalidateQueries('nopv2-auth');
                queryClient.invalidateQueries('latest-nopv2-auth');
            },
        },
    });
};
