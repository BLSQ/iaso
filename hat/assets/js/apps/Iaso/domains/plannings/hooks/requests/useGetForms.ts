import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { FETCHING_ABORTED } from '../../../../libs/constants';
import { DropdownOptions } from '../../../../types/utils';

const getForms = async (signal?: AbortSignal) =>
    getRequest('/api/forms', signal).then(async forms => {
        // return null if fetching aborted, so subsequent 'then()' can be returned early (see SingleTable)
        if (forms?.message === FETCHING_ABORTED) return null;
        return forms;
    });

export const useGetForms = (): UseQueryResult<
    DropdownOptions<string>,
    Error
> => {
    return useSnackQuery(['forms'], () => getForms(), undefined, {
        select: data => {
            if (!data?.forms) return [];
            return data.forms.map(forms => {
                return {
                    value: forms.id,
                    label: forms.name,
                };
            });
        },
    });
};
