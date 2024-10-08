import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../libs/apiHooks';
import { getRequest } from '../../../../../libs/Api';

import { Form, PossibleField } from '../../../../forms/types/forms';
import { usePossibleFields } from '../../../../forms/hooks/useGetPossibleFields';

export const useGetForm = (
    formId: number | undefined,
    enabled: boolean,
    fields?: string | undefined,
    appId?: string,
): UseQueryResult<Form, Error> => {
    const queryKey: any[] = ['form', formId];
    let url = `/api/forms/${formId}`;
    if (fields) {
        url += `/?fields=${fields}`;
        if (appId) {
            url += `&app_id=${appId}`;
        }
    } else if (appId) {
        url += `/?app_id=${appId}`;
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
    fields?: string[] | undefined,
): UseQueryResult<Form[], Error> => {
    const apiUrl = '/api/forms/?fields=id,name,latest_form_version';
    const url = fields ? `${apiUrl},${fields.join(',')}` : apiUrl;

    return useSnackQuery({
        queryKey: ['forms'],
        queryFn: () => getRequest(url),
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
type Result = {
    possibleFields: PossibleField[];
    isFetchingForm: boolean;
    name?: string;
};
export const useGetFormForEntityType = ({
    formId,
    enabled = true,
}: {
    formId?: number;
    enabled?: boolean;
}): Result => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        formId,
        enabled && Boolean(formId),
        'possible_fields,name',
    );
    return {
        ...usePossibleFields(isFetchingForm, currentForm),
        name: currentForm?.name,
    };
};
