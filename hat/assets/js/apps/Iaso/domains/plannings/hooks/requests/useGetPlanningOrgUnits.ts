import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { PlanningOrgUnits } from '../../types';

export const useGetPlanningOrgUnits = (
    planningId: string,
): UseQueryResult<PlanningOrgUnits[], Error> => {
    const url = makeUrlWithParams('/api/microplanning/orgunits/', {
        planning_id: planningId,
    });
    return useSnackQuery({
        queryKey: ['planningOrgUnits', planningId],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(planningId),
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
        },
    });
};
