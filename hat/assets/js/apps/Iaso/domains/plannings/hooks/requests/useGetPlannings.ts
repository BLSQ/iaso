import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { DropdownOptions } from '../../../../types/utils';
import {
    dateApiToDateRangePicker,
    dateRangePickerToDateApi,
} from '../../../../utils/dates';
import { endpoint } from '../../constants';
import { PlanningParams } from '../../types';

export type OrgUnitDetails = {
    id: number;
    name: string;
    org_unit_type?: number;
};

export type PlanningApi = {
    id: number;
    name: string;
    description?: string;
    team: number;
    team_details: { name: string; id: number };
    published_at?: string;
    started_at?: string;
    ended_at?: string;
    org_unit_details: OrgUnitDetails;
    form?: [number];
    project_details: { name: string; id: number };
};

type Planning = PlanningApi & {
    status?: 'published' | 'draft';
};

type PlanningList = Pagination & {
    results: Planning[];
};

const getPlannings = async (options: PlanningParams): Promise<PlanningList> => {
    // assigning the variables allows us to have a params object without the unwanted keys
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { publishingStatus, dateTo, dateFrom, pageSize, ...params } =
        options as Record<string, any>;
    params.limit = options?.pageSize;
    params.started_at__gte = dateRangePickerToDateApi(options.dateFrom);
    params.ended_at__lte = dateRangePickerToDateApi(options.dateTo);
    params.publishing_status = options.publishingStatus;

    const url = makeUrlWithParams(endpoint, params);
    return getRequest(url) as Promise<PlanningList>;
};

export const useGetPlannings = (
    options: PlanningParams,
): UseQueryResult<PlanningList, Error> => {
    const queryKey: any[] = ['planningsList', options];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getPlannings(options),
        options: {
            keepPreviousData: true,
            cacheTime: 1000 * 60 * 5,
            staleTime: 1000 * 60 * 5,
            select: data => {
                return {
                    ...data,
                    results: data?.results.map(planning => {
                        return {
                            ...planning,
                            status: planning.published_at
                                ? 'published'
                                : 'draft',
                            started_at: dateApiToDateRangePicker(
                                planning.started_at,
                            ),
                            ended_at: dateApiToDateRangePicker(
                                planning.ended_at,
                            ),
                        };
                    }),
                };
            },
        },
    });
};

const getPlanningsOptions = async (
    formIds?: string,
): Promise<PlanningApi[]> => {
    const apiParams: Record<string, any> = {};
    if (formIds) {
        apiParams.form_ids = formIds;
    }
    const url = makeUrlWithParams(endpoint, apiParams);
    return getRequest(url) as Promise<PlanningApi[]>;
};
export const useGetPlanningsOptions = (
    formIds?: string,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const queryKey: any[] = ['planningsList', formIds];
    return useSnackQuery({
        queryKey,
        queryFn: () => getPlanningsOptions(formIds),
        options: {
            select: (data: Planning[]) => {
                return data?.map(planning => {
                    return {
                        value: planning.id,
                        label: planning.name,
                        original: planning,
                    };
                });
            },
        },
    });
};
