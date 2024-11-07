import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';

import MESSAGES from '../../messages';
import { makeUrlWithParams } from '../../../../libs/utils';

export const useGetOrgUnitDetail = (
    id?: number,
): UseQueryResult<OrgUnit, Error> => {
    const params: Record<string, any> = {
        instances_count: true,
    };

    const url = makeUrlWithParams(`/api/orgunits/${id}/`, params);

    return useSnackQuery({
        queryKey: ['orgunitdetail', id],
        queryFn: () => getRequest(url),
        snackErrorMsg: MESSAGES.fetchOrgUnitError,
        options: {
            enabled: Boolean(id),
        },
    });
};
