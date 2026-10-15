import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { LevelOrgUnitType } from './types';

export const useGetDescendantOrgUnitTypes = (
    orgUnitId?: number,
): UseQueryResult<LevelOrgUnitType[], Error> =>
    useSnackQuery({
        queryKey: ['descendantOrgUnitTypes', orgUnitId],
        queryFn: () =>
            getRequest(
                makeUrlWithParams('/api/v2/orgunittypes/descendants/', {
                    orgUnitId,
                }),
            ),
        options: {
            enabled: Boolean(orgUnitId),
            staleTime: Infinity,
        },
    });
