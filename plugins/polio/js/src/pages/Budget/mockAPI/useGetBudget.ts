/* eslint-disable camelcase */
import { useMemo } from 'react';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { Paginated } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { waitFor } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { getApiParamDateString } from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { makePaginatedResponse, pageOneTemplate } from './utils';
import { Nullable } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type Budget = {
    id: number;
    obr_name: string;
    country_name: string;
    current_state: {
        key: string;
        label: string;
    };
    // -> optional: need to pass a param for the API to return it
    next_transitions?: {
        key: string;
        label: string;
        allowed: boolean; // depends on the user's team
        reason_not_allowed: Nullable<string>;
        required_fields: string[]; // comment, file, links
        help_text: string;
        displayed_fields: string[]; // This field determines the columns shown in the "create" modal
    }[];
};

const mockBudgets: Budget[] = [
    {
        id: 1,
        obr_name: 'SEN-3DS-2022',
        country_name: 'SENEGAL',
        current_state: { key: 'submitted_rrt', label: 'Submitted to RRT' },
    },
    {
        id: 2,
        obr_name: 'MWI-2DS-2022',
        country_name: 'MALAWI',
        current_state: {
            key: 'budget_requested',
            label: 'Budget requested',
        },
    },
];

const mockBudgetsForCampaigns = {
    'SEN-3DS-2022': {
        id: 1,
        obr_name: 'SEN-3DS-2022',
        country_name: 'SENEGAL',
        current_state: { key: 'submitted_rrt', label: 'Submitted to RRT' },
        next_transitions: [
            {
                key: 'submit_to_ORPG',
                label: 'Submit to ORPG',
                allowed: true,
                reason_not_allowed: null,
                required_fields: ['files'],
                help_text: 'attach file to submit to ORPG',
                displayed_fields: ['comment', 'files', 'links', 'amount'],
            },
            {
                key: 'give_feedback_gpei',
                label: 'Send feedback to GPEI',
                allowed: true,
                reason_not_allowed: null,
                required_fields: ['files'],
                help_text: 'send file with comments to GPEI',
                displayed_fields: ['comment', 'files', 'links', 'amount'],
            },
        ],
    },
    'MWI-2DS-2022': {
        id: 2,
        obr_name: 'MWI-2DS-2022',
        country_name: 'MALAWI',
        current_state: {
            key: 'budget_requested',
            label: 'Budget requested',
        },
        next_transitions: [
            {
                key: 'send_to_GPEI',
                label: 'Send to GPEI',
                allowed: false,
                reason_not_allowed: 'User is not in authorised team',
                required_fields: ['files'],
                help_text: 'attach file to send to GPEI',
                displayed_fields: ['comment', 'files', 'links', 'amount'],
            },
        ],
    },
};

const getBudgets = async (params): Promise<Paginated<Budget>> => {
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    console.log('query string', queryString);
    await waitFor(1000);
    const response = makePaginatedResponse<Budget>({
        ...pageOneTemplate,
        dataKey: 'results',
        data: mockBudgets,
    });
    return response;
};

export const useGetBudgets = (options: any): any => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.search,
        current_state__key: options.current_state__key,
    };

    return useSnackQuery({
        queryFn: () => getBudgets(params),
        queryKey: ['budget', 'all', params],
    });
};

export const useBudgetParams = params => {
    return useMemo(() => {
        return {
            order: params?.order ?? '-obr_name',
            pageSize: params?.pageSize ?? 20,
            page: params?.page ?? 1,
            search: params.search,
            roundStartFrom: getApiParamDateString(params.roundStartFrom),
            roundStartTo: getApiParamDateString(params.roundStartTo),
        };
    }, [
        params?.order,
        params?.page,
        params?.pageSize,
        params.roundStartFrom,
        params.roundStartTo,
        params.search,
    ]);
};

const getBudgetForCampaign = async obrName => {
    await waitFor(1000);
    const result = mockBudgetsForCampaigns[obrName];
    return result;
};

export const useGetBudgetForCampaign = (obrName?: string) => {
    return useSnackQuery({
        queryFn: () => getBudgetForCampaign(obrName),
        queryKey: ['budget', 'campaign', obrName],
        options: { enabled: Boolean(obrName) },
    });
};
