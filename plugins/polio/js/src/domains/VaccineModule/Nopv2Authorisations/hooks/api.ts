import { UseMutationResult, UseQueryResult, useQueryClient } from 'react-query';
import { ApiParams, UrlParams } from 'bluesquare-components';
import {
    FormattedUrlParams,
    useUrlParams,
} from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
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
import {
    AuthorisationAPIResponse,
    AuthorisationData,
    VaccineAuthParams,
} from '../types';

const listUrl =
    '/api/polio/vaccineauthorizations/get_most_recent_authorizations/';
const baseUrl = '/api/polio/vaccineauthorizations/';

type GetListParams = VaccineAuthParams & Partial<ApiParams>;

const getVaccineAuthorisationsList = (
    params: GetListParams,
): Promise<AuthorisationAPIResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

type GetLatestAuthParams = VaccineAuthParams & Partial<UrlParams>;

export const useGetLatestAuthorisations = (
    params: GetLatestAuthParams,
): UseQueryResult<AuthorisationAPIResponse, any> => {
    const safeParams = useUrlParams(params as Partial<UrlParams>);
    const apiParams = useApiParams(safeParams) as GetListParams;
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
                if (!data)
                    return {
                        results: [],
                    } as unknown as AuthorisationAPIResponse;
                return data;
            },
        },
    });
};

const getAuthorisations = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${baseUrl}?${queryString}`);
};

export const useGetAuthorisations = (
    params: FormattedUrlParams,
): UseQueryResult<AuthorisationAPIResponse, any> => {
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

const deleteNopv2Authorisation = (authorisationId: number) => {
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

const createEditNopv2Authorisation = (body: AuthorisationData) => {
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
