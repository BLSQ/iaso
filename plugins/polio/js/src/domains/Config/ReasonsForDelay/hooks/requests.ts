import { UseMutationResult, UseQueryResult } from 'react-query';
import {
    FormattedApiParams,
    useApiParams,
} from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    getRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { FormattedUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { makeUrlWithParams } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

export type ReasonForDelay = 'INITIAL_DATA' | string;

const apiUrl = '/api/polio/reasonsfordelay/';

const getReasonsForDelay = (params: FormattedApiParams) => {
    const url = makeUrlWithParams(apiUrl, params);
    return getRequest(url);
};

export const useReasonsForDelay = (
    params: FormattedUrlParams,
): UseQueryResult<any, any> => {
    const queryParams = useApiParams(params);
    return useSnackQuery({
        queryKey: ['reasonsForDelay', 'manage', queryParams],
        queryFn: () => getReasonsForDelay(queryParams),
        options: {
            select: data => {
                if (!data) return [];
                return data;
            },
        },
    });
};

const createEditReasonForDelay = (body: any) => {
    if (body.id) {
        return patchRequest(`${apiUrl}${body.id}/`, body);
    }
    return postRequest(apiUrl, body);
};

export const useCreateEditReasonForDelay = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (body: any) => createEditReasonForDelay(body),
        invalidateQueryKey: ['reasonsForDelay'],
        ignoreErrorCodes: [400],
    });
};
