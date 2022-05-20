/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { Pagination } from '../../../../types/table';
import { PlanningParams } from '../../types';

type PlanningApi = {
    id: number;
    name: string;
    description?: string;
    team: number;
    team_details: { name: string; id: number };
    published_at?: string;
    start_date?: string;
    end_date?: string;
};

type Planning = PlanningApi & {
    status?: 'published' | 'draft';
};

type PlanningList = Pagination & {
    results: Planning[];
};

const getPlannings = async (options: PlanningParams): Promise<PlanningList> => {
    const params = {
        ...options,
        limit: options?.pageSize,
        // page: options?.page ? parseInt(options.page, 10) - 1 : null,
    };
    const url = makeUrlWithParams('/api/microplanning/planning', params);
    return getRequest(url) as Promise<PlanningList>;
};

export const useGetPlannings = (
    options: PlanningParams,
): UseQueryResult<PlanningList, Error> => {
    const queryKey: any[] = ['planningsList', options];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getPlannings(options), undefined, {
        select: data => {
            return {
                ...data,
                results: data?.results.map(planning => {
                    return {
                        ...planning,
                        status: planning.published_at ? 'published' : 'draft',
                    };
                }),
            };
        },
    });
};
