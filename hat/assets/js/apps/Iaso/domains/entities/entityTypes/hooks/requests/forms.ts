import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../libs/apiHooks';
import { getRequest } from '../../../../../libs/Api';

import { Form } from '../../../../forms/types/forms';

export const useGetForm = (
    formId: number | undefined,
    enabled: boolean,
    fields?: string | undefined,
): UseQueryResult<Form, Error> => {
    const queryKey: any[] = ['form', formId];
    let url = `/api/forms/${formId}`;
    if (fields) {
        url += `?fields=${fields}`;
    }
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled,
        },
    });
};
