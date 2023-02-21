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
        url += `/?fields=${fields}`;
    }
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled,
        },
    });
};

export const useGetForms = (
    enabled: boolean,
): UseQueryResult<Form[], Error> => {
    return useSnackQuery({
        queryKey: ['forms'],
        queryFn: () =>
            getRequest('/api/forms/?fields=id,name,latest_form_version'),
        options: {
            staleTime: 60000,
            enabled,
            select: data =>
                data?.forms.filter(form =>
                    Boolean(form.latest_form_version?.xls_file),
                ),
        },
    });
};
