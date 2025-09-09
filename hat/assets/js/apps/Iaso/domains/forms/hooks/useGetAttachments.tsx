import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { FormAttachment, FormParams } from '../types/forms';

export interface FormAttachmentsApiResult extends Pagination {
    results: FormAttachment[];
}

type ApiParams = {
    limit: string;
    page: string;
    order: string;
    form_id: string;
};

const useGetApiParams = (params: FormParams): ApiParams => ({
    limit: params.attachmentsPageSize || '20',
    page: params.attachmentsPage || '1',
    order: params.attachmentsOrder || 'updated_at',
    form_id: params.formId,
});

export const useGetAttachments = (
    params: FormParams,
): UseQueryResult<FormAttachmentsApiResult, Error> => {
    const queryKey: any[] = ['formAttachments', params];
    const apiParams = useGetApiParams(params);

    const url = makeUrlWithParams('/api/formattachments/', apiParams);
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
