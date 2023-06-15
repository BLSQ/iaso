/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { Pagination } from 'bluesquare-components';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { FormAttachment, FormParams } from '../types/forms';
import { makeUrlWithParams } from '../../../libs/utils';

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
