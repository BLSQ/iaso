import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';

import MESSAGES from '../../messages';

export const useGetOrgUnitDetail = (
    id?: number,
): UseQueryResult<OrgUnit, Error> => {
    return useSnackQuery({
        queryKey: ['orgunitdetail', id],
        queryFn: () => getRequest(`/api/orgunits/${id}/`),
        snackErrorMsg: MESSAGES.fetchOrgUnitError,
        options: {
            enabled: Boolean(id),
        },
    });
};
