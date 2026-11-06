import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import MESSAGES from '../../messages';
import { OrgUnit } from '../../types/orgUnit';

// Enough for a LinkToOrgUnit, skips the expensive instances_count.
export const ORG_UNIT_LINK_FIELDS = 'id,name';

export const useGetOrgUnitDetail = (
    id?: number,
    // Optional `fields=` allow-list, the full org unit when omitted.
    fields?: string,
): UseQueryResult<OrgUnit, Error> => {
    return useSnackQuery({
        queryKey: ['orgunitdetail', id, fields],
        queryFn: () =>
            getRequest(
                `/api/orgunits/${id}/${fields ? `?fields=${fields}` : ''}`,
            ),
        snackErrorMsg: MESSAGES.fetchOrgUnitError,
        options: {
            enabled: Boolean(id),
        },
    });
};
