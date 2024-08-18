import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Form } from '../../../forms/types/forms';
import { useApiParams } from '../../../../hooks/useApiParams';

const getForms = params => {
    debugger;
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/forms/?${queryString}`).then((value) => {
        debugger;
        return value.forms.map(f => {
            return  {
                value: f.id,
                label: f.name
            }
        })
    });
};

export const tableDefaults = {
    order: 'updated_at',
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
export const useGetFormsDropdownOptions = (
    params,
    defaults = tableDefaults,
): UseQueryResult<FormResponse, Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['form', 'options', safeParams],
        queryFn: () => getForms({ ...safeParams }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
