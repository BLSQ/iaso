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
import { Budget, Workflow, Categories } from '../../types';

const getBudgets = (params: any) => {
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    if (!params.order) {
        filteredParams.push(['order', '-cvdpv2_notified_at']);
    }
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budget/?${queryString}`);
};

export const useGetBudgets = (options: any): any => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.search,
        budget_current_state_key__in: options.budget_current_state_key__in,
        fields: 'id,obr_name,country_name,current_state,cvdpv2_notified_at,possible_states,budget_last_updated_at',
    };

    return useSnackQuery({
        queryFn: () => getBudgets(params),
        queryKey: ['budget', 'all', params],
    });
};

export const useBudgetParams = params => {
    return useMemo(() => {
        return {
            order: params?.order ?? '-cvdpv2_notified_at',
            pageSize: params?.pageSize ?? 20,
            page: params?.page ?? 1,
            search: params.search,
            roundStartFrom: getApiParamDateString(params.roundStartFrom),
            roundStartTo: getApiParamDateString(params.roundStartTo),
            budget_current_state_key__in: params.current_state__key,
        };
    }, [
        params.current_state__key,
        params?.order,
        params?.page,
        params?.pageSize,
        params.roundStartFrom,
        params.roundStartTo,
        params.search,
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
        // add timeline field
        fields: 'id,obr_name,current_state,next_transitions,possible_transitions',
    };

    const mockBudgetTimeline: Categories = [
        {
            key: 'step_1',
            label: 'MoH, GPEI, UNICEF & WHO COs',
            color: 'green',
            items: [
                {
                    label: 'WHO Co Budget Request',
                    performed_on: '2022-05-18',
                    performed_by: {
                        username: 'Spike',
                        first_name: 'Spike',
                        last_name: 'Spiegel',
                    },
                },
                {
                    label: 'UNICEF Co Budget Request',
                    performed_on: '2022-05-19',
                    performed_by: {
                        username: 'Faye',
                        first_name: 'Faye',
                        last_name: 'Valentine',
                    },
                },
                {
                    label: 'GPEI Budget Consolidation',
                    performed_on: '2022-05-21',
                    performed_by: {
                        username: 'Ed',
                        first_name: 'Edward',
                        last_name: 'Wong',
                    },
                },
            ],
        },
        {
            key: 'step_2',
            label: 'RRT finances',
            color: 'green',
            items: [
                {
                    label: 'Budget Submitted to RRT',
                    performed_on: '2022-05-23',
                    performed_by: {
                        username: 'Jet',
                        first_name: 'Jet',
                        last_name: 'Black',
                    },
                },
                {
                    label: 'Feedback received by GPEI Co Budget Request',
                    performed_on: '2022-05-25',
                    performed_by: {
                        username: ' Oni',
                        first_name: 'Onizuka',
                        last_name: 'Eikichi',
                    },
                },
            ],
        },
        {
            key: 'step_3',
            label: 'ORPG',
            color: 'green',
            items: [
                {
                    label: 'Budget Submitted to ORPG',
                    performed_on: '2022-05-28',
                    performed_by: {
                        username: 'Aizawa',
                        first_name: 'Aizawa',
                        last_name: 'Miyabi',
                    },
                },
                {
                    label: 'Feedback received by RRT',
                    performed_on: '2022-06-03',
                    performed_by: {
                        username: ' Uehara',
                        first_name: 'Uehara',
                        last_name: 'Anko',
                    },
                },
            ],
        },
        {
            key: 'step_4',
            label: 'WHO/UNICEF',
            color: 'grey',
            items: [
                {
                    label: 'Budget Submitted to WHO',
                },
                {
                    label: 'Budget Sumbitted to UNICEF',
                },
                {
                    label: 'Budget Sumbitted by ORPG (WHO)',
                },
                {
                    label: 'Budget Sumbitted to ORPG (UNICEF)',
                },
            ],
        },
        {
            key: 'step_5',
            label: 'Funding Release',
            color: 'grey',
            items: [
                {
                    label: 'Budget Final Approval',
                },
                {
                    label: 'Funds release to COs',
                },
                {
                    label: 'Funds release to Operations',
                },
            ],
        },
    ];

    return useSnackQuery({
        queryFn: () => getBudgetForCampaign(id, params),
        queryKey: ['budget', 'campaign', id],
        options: {
            enabled: Boolean(id),
            select: (data: Partial<Budget>) => {
                const newData = {
                    ...data,
                    timeline: { categories: mockBudgetTimeline },
                };

                return newData;
            },
        },
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

export const useGetBudgetTimeline = () => {};
