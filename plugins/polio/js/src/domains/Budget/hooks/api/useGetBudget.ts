import { groupBy } from 'lodash';
import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    DropdownOptions,
    Optional,
} from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { getApiParamDateString } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { Budget, BudgetDetail, Workflow } from '../../types';

type Option = {
    current_state_key: [number | string];
    countries: [number | string];
    order?: string;
    org_unit_groups: [number | string];
    page?: number;
    pageSize?: number;
    roundStartFrom?: string;
    roundStartTo?: string;
    search?: string;
};

type Param = {
    current_state_key?: string; // comma separated array
    countries?: string; // comma separated array
    order?: string;
    org_unit_groups?: string; // comma separated array
    page?: number | string;
    pageSize?: number | string;
    roundStartFrom?: string;
    roundStartTo?: string;
    search?: string;
};

const budgetDetailsFields: string[] = [
    'id',
    'campaign_id',
    'obr_name',
    'country_name',
    'current_state',
    'rounds',
    'possible_states',
    'updated_at',
    'ra_completed_at_WFEDITABLE',
    'who_sent_budget_at_WFEDITABLE',
    'unicef_sent_budget_at_WFEDITABLE',
    'gpei_consolidated_budgets_at_WFEDITABLE',
    'submitted_to_rrt_at_WFEDITABLE',
    'feedback_sent_to_gpei_at_WFEDITABLE',
    're_submitted_to_rrt_at_WFEDITABLE',
    'submitted_to_orpg_operations1_at_WFEDITABLE',
    'feedback_sent_to_rrt1_at_WFEDITABLE',
    're_submitted_to_orpg_operations1_at_WFEDITABLE',
    'submitted_to_orpg_wider_at_WFEDITABLE',
    'submitted_to_orpg_operations2_at_WFEDITABLE',
    'feedback_sent_to_rrt2_at_WFEDITABLE',
    're_submitted_to_orpg_operations2_at_WFEDITABLE',
    'submitted_for_approval_at_WFEDITABLE',
    'feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE',
    'feedback_sent_to_orpg_operations_who_at_WFEDITABLE',
    'approved_by_who_at_WFEDITABLE',
    'approved_by_unicef_at_WFEDITABLE',
    'approved_at_WFEDITABLE',
    'approval_confirmed_at_WFEDITABLE',
    'payment_mode',
    'district_count',
    'who_disbursed_to_co_at',
    'who_disbursed_to_moh_at',
    'unicef_disbursed_to_co_at',
    'unicef_disbursed_to_moh_at',
    'no_regret_fund_amount',
    'current_state',
    'has_data_in_budget_tool',
];
export const useGetBudget = (
    id: number,
    onSuccess: (data: BudgetDetail) => void = () => null,
): UseQueryResult<BudgetDetail, Error> => {
    return useSnackQuery({
        queryFn: () =>
            getRequest(
                `/api/polio/budget/${id}/?fields=${budgetDetailsFields.join(
                    ',',
                )}`,
            ),
        queryKey: ['budget', id],
        options: {
            enabled: Boolean(id),
            keepPreviousData: true,
            onSuccess: data => {
                onSuccess(data);
            },
        },
    });
};
const getBudgets = (params: any) => {
    const filteredParams = Object.entries(params).filter(
        ([, value]) => value !== undefined,
    );
    if (!params.order) {
        filteredParams.push(['order', '-updated_at']);
    }

    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budget/?${queryString}`);
};

const budgetFields: string[] = [
    'id',
    'campaign_id',
    'obr_name',
    'country_name',
    'current_state',
    'rounds',
    'possible_states',
    'updated_at',
];
export const useGetBudgets = (options: Option): any => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.search,
        current_state_key: options.current_state_key,
        countries: options.countries,
        org_unit_groups: options.org_unit_groups,
        fields: budgetFields.join(','),
    };

    return useSnackQuery({
        queryFn: () => getBudgets(params),
        queryKey: ['budget', 'all', params],
    });
};

export const useBudgetParams = (params: Param): any => {
    return useMemo(() => {
        return {
            order: params?.order ?? '-updated_at',
            pageSize: params?.pageSize ?? 20,
            page: params?.page ?? 1,
            search: params.search,
            roundStartFrom: getApiParamDateString(params.roundStartFrom),
            roundStartTo: getApiParamDateString(params.roundStartTo),
            current_state_key: params.current_state_key,
            countries: params?.countries,
            org_unit_groups: params?.org_unit_groups,
        };
    }, [
        params?.order,
        params?.pageSize,
        params?.page,
        params.search,
        params.roundStartFrom,
        params.roundStartTo,
        params.current_state_key,
        params?.countries,
        params?.org_unit_groups,
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
        fields: 'id,obr_name,current_state,next_transitions,possible_transitions,rounds,timeline',
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
