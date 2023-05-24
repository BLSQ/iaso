/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

type FormAttachment = {
    id: number;
    name: string;
    file: string;
    md5: string;
    form_id: number;
    created_at: number;
    updated_at: number;
};

export type FormAttachmentsApiResult = {
    results: FormAttachment[];
};

export const useGetAttachments = (
    formId: number | undefined,
): UseQueryResult<FormAttachmentsApiResult, Error> => {
    const queryKey: any[] = ['formattachments', formId];
    const url = `/api/formattachments/?form_id=${formId}`;
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled: Boolean(formId),
        },
    });
};
