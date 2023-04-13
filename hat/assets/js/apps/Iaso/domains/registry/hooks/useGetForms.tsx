import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { Form } from '../../forms/types/forms';

export type DropdownOptions<T> = {
    label: string;
    value: T;
    original: Form;
};

export const useGetForms = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['forms'],
        queryFn: () =>
            getRequest(
                '/api/forms/?fields=id,name,label_keys,period_type,org_unit_type_ids',
            ),
        options: {
            select: data =>
                data?.forms?.map(t => ({
                    label: t.name,
                    value: t.id,
                    original: t,
                })) || [],
        },
    });
};
