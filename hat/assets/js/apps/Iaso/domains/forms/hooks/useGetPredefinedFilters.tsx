import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { FormPredefinedFilter, FormParams } from '../types/forms';

export interface FormAttachmentsApiResult extends Pagination {
    form_predefined_filters: FormPredefinedFilter[];
}

type ApiParams = {
    limit: string;
    page: string;
    order: string;
    form_id: number;
};

const useGetApiParams = (params: FormParams): ApiParams => ({
    limit: params.predefinedFiltersPageSize || '20',
    page: params.predefinedFiltersPage || '1',
    order: params.predefinedFiltersOrder || 'name',
    form_id: params.formId,
});

export const useGetPredefinedFilters = (
    params: FormParams,
): UseQueryResult<FormAttachmentsApiResult, Error> => {
    const queryKey: any[] = ['formPredefinedFilters', params];
    const apiParams = useGetApiParams(params);

    const url = makeUrlWithParams('/api/formpredefinedfilters/', apiParams);
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled: Boolean(params.formId),
            keepPreviousData: true,
        },
    });
};
