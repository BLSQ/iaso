import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { usePossibleFields } from '../../../../forms/hooks/useGetPossibleFields';
import { Form, PossibleField } from '../../../../forms/types/forms';

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
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
        },
    });
};

export const useGetForms = (
    enabled: boolean,
    fields?: string[] | undefined,
): UseQueryResult<Form[], Error> => {
    const apiUrl = '/api/forms/?fields=id,name,latest_form_version,form_id';
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
        'possible_fields_with_latest_version,name,latest_form_version',
    );
    return {
        ...usePossibleFields(
            isFetchingForm,
            currentForm,
            'possible_fields_with_latest_version',
        ),
        name: currentForm?.name,
    };
};
