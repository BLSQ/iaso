import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../libs/apiHooks';
import { getRequest } from '../../../../libs/Api';

import { Form } from '../../../forms/types/forms';

export const useGetForms = (): UseQueryResult<Form[], Error> => {
    return useSnackQuery({
        queryKey: ['forms'],
        queryFn: () => getRequest('/api/forms/?fields=id,name'),
        options: {
            staleTime: 60000,
            select: data => data?.forms,
        },
    });
};
