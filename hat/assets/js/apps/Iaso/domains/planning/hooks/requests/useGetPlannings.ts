/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Pagination } from '../../../../types/table';
import { list } from '../../mockPlanningList.js';
import { PlanningParams } from '../../types';

type Planning = {
    id: number;
    name: string;
    team: { name: string; id: number };
    status: boolean;
    start_date: string; // can this be null on the back end side?
    end_date: string;
};

type PlanningList = Pagination & {
    plannings: Planning[];
};

export const waitFor = (delay: number) =>
    new Promise(resolve => setTimeout(resolve, delay));

const getPlannings = async (options: PlanningParams): Promise<PlanningList> => {
    await waitFor(1500);
    console.log('options', options);
    return list;
};

export const useGetPlannings = (
    options: PlanningParams,
): UseQueryResult<PlanningList, Error> => {
    const queryKey: any[] = ['planningsList', options];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getPlannings(options));
};
