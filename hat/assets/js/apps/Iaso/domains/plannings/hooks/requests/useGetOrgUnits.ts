import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';

export const useGetOrgUnitsByOrgUnitTypeId = ({
    orgUnitTypeId,
    projectId,
    excludedOrgUnitParentIds,
}): UseQueryResult<OrgUnit[], Error> => {
    return useSnackQuery({
        queryKey: [
            'orgUnitsByType',
            orgUnitTypeId,
            projectId,
            excludedOrgUnitParentIds,
        ],
        queryFn: () =>
            getRequest(
                makeUrlWithParams('/api/orgunits/', {
                    orgUnitTypeId,
                    project: projectId,
                    defaultVersion: 'true',
                    excludedOrgUnitParentIds,
                }),
            ),
        options: {
            enabled: Boolean(orgUnitTypeId) && Boolean(projectId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => data?.orgUnits || [],
        },
    });
};
