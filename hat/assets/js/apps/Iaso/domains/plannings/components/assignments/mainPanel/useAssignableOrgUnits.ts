import { UseQueryResult } from 'react-query';
import { useApiMicroplanningPlanningsConfigsList } from 'Iaso/api/plannings';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { AssignableOrgUnit } from './types';

const FIRST_LEVEL = 1;

const useLevelOrgUnitTypeIds = (
    planningId: string,
    level: number,
): number[] | undefined => {
    const { data: configs } = useApiMicroplanningPlanningsConfigsList(
        Number(planningId),
        undefined,
        { query: { enabled: Boolean(planningId) } },
    );
    return configs?.results
        ?.find(config => config.level === level)
        ?.org_unit_types?.map(type => type.id);
};

// Until the assignment scope API exists, the org units are those of the first level under the root area.
export const useAssignableOrgUnits = (
    planningId: string,
    rootOrgUnitId?: number,
): UseQueryResult<AssignableOrgUnit[]> => {
    const orgUnitTypeIds = useLevelOrgUnitTypeIds(planningId, FIRST_LEVEL);
    const params = {
        asLocation: 'true',
        limit: '10000',
        validation_status: 'VALID',
        orgUnitParentId: rootOrgUnitId,
        orgUnitTypeId: orgUnitTypeIds?.join(','),
    };
    return useSnackQuery({
        queryKey: ['assignableOrgUnits', params],
        queryFn: () => getRequest(makeUrlWithParams('/api/orgunits/', params)),
        options: {
            enabled: Boolean(rootOrgUnitId && orgUnitTypeIds?.length),
            staleTime: Infinity,
            keepPreviousData: true,
        },
    });
};
