import { UseQueryResult } from 'react-query';
import {
    FormattedApiParams,
    useApiParams,
} from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
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
