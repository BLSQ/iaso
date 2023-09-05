/* eslint-disable camelcase */
import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { groupBy } from 'lodash';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getApiParamDateString } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    DropdownOptions,
    Optional,
} from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Budget, Workflow } from '../../types';

type Option = {
    budget_current_state_key__in: [number | string];
    country__id__in: [number | string];
    order?: string;
    orgUnitGroups: [number | string];
    page?: number;
    pageSize?: number;
    roundStartFrom?: string;
    roundStartTo?: string;
    search?: string;
};

type Param = {
    accountId: string;
    budget_current_state_key__in: [number | string];
    country__id__in: [number | string];
    order: string;
    orgUnitGroups: [number | string];
    page: number | string;
    pageSize: number | string;
    roundStartFrom: string;
    roundStartTo: string;
    search: string;
};
const getBudgets = (params: any) => {
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([, value]) => value !== undefined,
    );
    if (!params.order) {
        filteredParams.push(['order', '-cvdpv2_notified_at']);
    }

    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budget/?${queryString}`);
};

export const useGetBudgets = (options: Option): any => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.search,
        budget_current_state_key__in: options.budget_current_state_key__in,
        country__id__in: options.country__id__in,
        orgUnitGroups: options.orgUnitGroups,
        fields: 'id,obr_name,country_name,current_state,cvdpv2_notified_at,possible_states,budget_last_updated_at',
    };

    return useSnackQuery({
        queryFn: () => getBudgets(params),
        queryKey: ['budget', 'all', params],
    });
};

export const useBudgetParams = (params: Param): any => {
    return useMemo(() => {
        return {
            order: params?.order ?? '-cvdpv2_notified_at',
            pageSize: params?.pageSize ?? 20,
            page: params?.page ?? 1,
            search: params.search,
            roundStartFrom: getApiParamDateString(params.roundStartFrom),
            roundStartTo: getApiParamDateString(params.roundStartTo),
            budget_current_state_key__in: params.budget_current_state_key__in,
            country__id__in: params?.country__id__in,
            orgUnitGroups: params?.orgUnitGroups,
        };
    }, [
        params?.order,
        params?.pageSize,
        params?.page,
        params.search,
        params.roundStartFrom,
        params.roundStartTo,
        params.budget_current_state_key__in,
        params?.country__id__in,
        params?.orgUnitGroups,
    ]);
};

const getBudgetForCampaign = (id: Optional<string>, params) => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/polio/budget/${id}/?${queryString}`);
};

export const useGetBudgetForCampaign = (
    id: Optional<string>,
): UseQueryResult<Partial<Budget>> => {
    const params = {
        fields: 'id,obr_name,current_state,next_transitions,possible_transitions,timeline',
    };

    return useSnackQuery({
        queryFn: () => getBudgetForCampaign(id, params),
        queryKey: ['budget', 'campaign', id],
        options: { enabled: Boolean(id) },
    });
};

const getBudgetWorkflow = () => {
    return getRequest(`/api/polio/workflow/current/`);
};

export const useGetWorkflowStatesForDropdown = (): UseQueryResult<
    DropdownOptions<string>[]
> => {
    return useSnackQuery({
        queryFn: () => getBudgetWorkflow(),
        queryKey: ['budget', 'workflow'],
        options: {
            select: (data: Workflow) => {
                const apiPossibleStates = data?.states ?? [];
                return Object.entries(groupBy(apiPossibleStates, 'label')).map(
                    ([label, items]) => {
                        return {
                            label,
                            value: items.map(i => i.key).join(','),
                        };
                    },
                );
            },
        },
    });
};
