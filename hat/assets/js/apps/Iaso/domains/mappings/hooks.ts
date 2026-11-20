import { useRedirectToReplace } from 'bluesquare-components';
import { UseMutationResult, UseQueryResult } from 'react-query';
import { getRequest, postRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { baseUrls } from '../../constants/urls';
import { useApiParams } from '../../hooks/useApiParams';
import MESSAGES from './messages';
import { MappingVersionRow } from './types';

const defaultTimes = {
    staleTime: 1000 * 60 * 15, // in MS
    cacheTime: 1000 * 60 * 5,
};
const defaultQueryParams = {};

export type MappingVersionsParams = Record<string, any> & {
    formId?: string | number;
    form_id?: string | number;
};

export type MappingVersionsListResponse = {
    count?: number;
    pages?: number;
    mapping_versions?: MappingVersionRow[];
    [key: string]: any;
};

export type CreateMappingPayload = {
    form_version: { id: number };
    mapping: { type: string; datasource: { id: number } };
    dataset?: any;
    program?: any;
};

export type MappingVersionDetail = {
    mappingVersion: MappingVersionRow;
    formVersion: Record<string, any>;
};

export const useGetMappingVersions = (
    params: MappingVersionsParams,
): UseQueryResult<MappingVersionsListResponse> => {
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

        // previously top-level; useSnackQuery only forwards `options` to react-query
        options: {
            keepPreviousData: true,
            ...defaultTimes,
        },
    });
};

export const useCreateMappingMutation = (): UseMutationResult<
    MappingVersionRow,
    unknown,
    CreateMappingPayload
> => {
    const redirectToReplace = useRedirectToReplace();

    return useSnackMutation({
        mutationFn: (payload: CreateMappingPayload) => {
            return postRequest('/api/mappingversions/', payload);
        },
        invalidateQueryKey: ['mappingversions'],
        snackErrorMsg: MESSAGES.fetchMappingsError,
        options: {
            onSuccess: (result: MappingVersionRow) => {
                redirectToReplace(baseUrls.mappingDetail, {
                    mappingVersionId: result.id,
                });
            },
        },
    });
};

export const useDataSources = (): UseQueryResult<any[]> => {
    return useSnackQuery({
        queryKey: ['mappingversions'],
        queryFn: () => getRequest('/api/datasources/').then(r => r.sources),
        options: {
            keepPreviousData: true,
            ...defaultTimes,
        },
    });
};

export const useGetMappingVersionDetail = (
    mappingVersionId: string | number | undefined,
): UseQueryResult<MappingVersionDetail> => {
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
        options: {
            ...defaultTimes,
        },
    });
};
