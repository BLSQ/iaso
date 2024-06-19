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

type FormResponse = {
    limit: number;
    count: number;
    forms: Form[];
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
};
export const useGetForms = (
    params,
    defaults = tableDefaults,
): UseQueryResult<FormResponse, Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['forms', safeParams],
        queryFn: () => getForms({ ...safeParams }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
