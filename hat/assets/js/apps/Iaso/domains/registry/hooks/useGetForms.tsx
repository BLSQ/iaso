import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { Form } from '../../forms/types/forms';

export type DropdownOptions<T> = {
    label: string;
    value: T;
    original: Form;
};

export const useGetForms = (
    apiParams: Record<string, any> | undefined = {},
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const fields = [
        'id',
        'name',
        'label_keys',
        'period_type',
        'org_unit_type_ids',
    ];
    const params: Record<string, any> = {
        fields: fields.join(','),
        ...apiParams,
    };
    const url = makeUrlWithParams('/api/forms/', params);
    return useSnackQuery({
        queryKey: ['forms', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.forms?.map(t => ({
                    label: t.name,
                    value: t.id,
                    original: t,
                })) || [],
        },
    });
};
