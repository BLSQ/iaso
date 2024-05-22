import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { Form } from '../types/forms';
import { useApiParams } from '../../../hooks/useApiParams';

const getForms = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/forms/?${queryString}`);
};

export const tableDefaults = {
    order: 'instance_updated_at',
    limit: 50,
    page: 1,
};
export const useGetForms = (
    params,
    enabled: boolean,
): UseQueryResult<Form[], Error> => {
    const safeParams = useApiParams(params, tableDefaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['forms', safeParams, enabled],
        queryFn: () => getForms({ ...safeParams, all: true }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
            enabled,
            // select: data => data?.forms ?? [],
        },
    });
};
