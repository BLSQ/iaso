import { UseQueryResult } from 'react-query';

import { Form } from '../../../../../hat/assets/js/apps/Iaso/domains/forms/types/forms';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../hat/assets/js/apps/Iaso/libs/utils';

export type DropdownOptions<T> = {
    label: string;
    value: T;
    original: Form;
};

export const useGetForms = (
    appId: string,
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
        app_id: appId,
        ...apiParams,
    };
    const url = makeUrlWithParams('/api/forms/', params);
    return useSnackQuery({
        queryKey: ['forms', url],
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
