import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { PlanningOrgUnits } from '../../../plannings/types';

export const useGetPlanningOrgUnitsChildren = (
    planningId: string,
): UseQueryResult<PlanningOrgUnits[], Error> => {
    const url = makeUrlWithParams('/api/microplanning/orgunits/children/', {
        planning: planningId,
    });
    return useSnackQuery({
        queryKey: ['planningChildrenOrgUnits', planningId],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(planningId),
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
        },
    });
};
export const useGetPlanningOrgUnitsRoot = (
    planningId: string,
): UseQueryResult<PlanningOrgUnits, Error> => {
    const url = makeUrlWithParams('/api/microplanning/orgunits/root/', {
        planning: planningId,
    });
    return useSnackQuery({
        queryKey: ['planningRootOrgUnit', planningId],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(planningId),
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
        },
    });
};
