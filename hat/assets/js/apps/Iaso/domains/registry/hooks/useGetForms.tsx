import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { DropdownOptions } from '../../../types/utils';

export const useGetForms = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['forms'],
        queryFn: () => getRequest('/api/forms/?fields=id,name'),
        options: {
            select: data =>
                data?.forms?.map(t => ({
                    label: t.name,
                    value: t.id,
                })) || [],
        },
    });
};
