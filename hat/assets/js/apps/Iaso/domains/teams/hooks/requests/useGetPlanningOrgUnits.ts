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
    params?: AssignmentParams,
): UseQueryResult<PlanningOrgUnits[], Error> => {
    const apiParams = {
        search: params?.search,
    };
    const url = makeUrlWithParams(
        `/api/microplanning/plannings/${planningId}/orgunits/children/`,
        apiParams,
    );
    return useSnackQuery({
        queryKey: ['planningChildrenOrgUnits', planningId, apiParams],
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
    const url = `/api/microplanning/plannings/${planningId}/orgunits/root/`;
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
    planningId?: string,
    params?: AssignmentParams,
): UseQueryResult<PaginatedPlanningOrgUnits, Error> => {
    const apiParams = {
        limit: params?.pageSize ?? tableDefaults.limit,
        page: params?.page ?? tableDefaults.page,
        order: tableDefaults.order,
        search: params?.search,
    };
    const url = Boolean(planningId)
        ? makeUrlWithParams(
              `/api/microplanning/plannings/${planningId}/orgunits/children-paginated/`,
              apiParams,
          )
        : '';
    return useSnackQuery({
        queryKey: ['planningChildrenOrgUnitsPaginated', planningId, apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(planningId),
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
        },
    });
};
