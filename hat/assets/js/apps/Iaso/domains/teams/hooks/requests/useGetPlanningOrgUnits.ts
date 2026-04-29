import { UseQueryResult } from 'react-query';
import { AssignmentParams } from 'Iaso/domains/assignments/types/assigment';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { PlanningOrgUnits } from '../../../plannings/types';

import { PaginatedPlanningOrgUnits } from '../../../plannings/types';

export const tableDefaults = {
    limit: 20,
    page: 1,
    order: '-name',
};
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

export const useGetPlanningOrgUnitsChildrenPaginated = (
    planningId?: number,
    params?: AssignmentParams,
): UseQueryResult<PaginatedPlanningOrgUnits, Error> => {
    const apiParams = {
        planning: planningId,
        limit: params?.pageSize ?? tableDefaults.limit,
        page: params?.page ?? tableDefaults.page,
        order: tableDefaults.order,
    };
    const url = makeUrlWithParams(
        '/api/microplanning/orgunits/children-paginated/',
        apiParams,
    );
    return useSnackQuery({
        queryKey: ['planningChildrenOrgUnitsPaginated', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(planningId),
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
        },
    });
};
