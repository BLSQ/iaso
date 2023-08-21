import { UseMutationResult, useQueryClient } from 'react-query';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    deleteRequest,
    getRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

const listUrl = '/api/polio/vaccineauthorizations/get_most_recent_update';
const baseUrl = '/api/polio/vaccineauthorizations/';

const getVaccineAuthorisationsList = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

export const useGetLatestAuthorisations = params => {
    const apiParams = useApiParams(params);
    return useSnackQuery({
        queryKey: ['latest-nopv2-auth', params],
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
