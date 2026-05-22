import { UseQueryResult } from 'react-query';

import { createSearchParamsWithArray } from 'Iaso/libs/utils';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { usePossibleFields } from '../../../../forms/hooks/useGetPossibleFields';
import { useGetForm } from '../../../../forms/requests';
import { Form, PossibleField } from '../../../../forms/types/forms';

export const useGetForms = (
    enabled: boolean,
    fields?: string[] | undefined,
): UseQueryResult<Form[], Error> => {
    const queryString = createSearchParamsWithArray({
        fields:
            fields ??
            ['id', 'name', 'latest_form_version', 'form_id'].join(','),
        order: 'name',
    }).toString();

    const url = `/api/forms/?${queryString}`;
    return useSnackQuery({
        queryKey: ['entitiesForms', 'forms'],
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
        [
            'possible_fields_with_latest_version',
            'name',
            'latest_form_version',
        ].join(','),
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
