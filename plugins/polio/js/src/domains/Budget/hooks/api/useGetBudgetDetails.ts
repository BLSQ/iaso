import { Paginated } from 'bluesquare-components';
import { UseMutationResult, UseQueryResult } from 'react-query';
import {
    deleteRequest,
    getRequest,
    patchRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { BudgetStep } from '../../types';

const getBudgetDetails = (params: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { accountId, pageSize, ...otherParams } = params;
    const urlParams = {
        ...otherParams,
        limit: pageSize ?? '10',
    };
    const filteredParams = Object.entries(urlParams).filter(
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budgetsteps/?${queryString}`);
};

export type DetailsParams = {
    action?: any;
    budget_process_id: string;
    country?: string;
    deletion_status?: any;
    order?: string;
    page?: string;
    pageSize?: string;
    show_hidden?: boolean;
    transition_key__in?: any;
};

export const useGetBudgetDetails = (
    params: DetailsParams,
): UseQueryResult<Paginated<BudgetStep>, Error> => {
    return useSnackQuery({
        queryFn: () => getBudgetDetails(params),
        queryKey: ['budget', 'details', params],
    });
};

// It's a delete request but UX wise it acts as a hide feature
const hideBudetStep = (id: number) => {
    return deleteRequest(`/api/polio/budgetsteps/${id}/`);
};

const unhideBudgetStep = (id: number) => {
    return patchRequest(`/api/polio/budgetsteps/${id}/`, { deleted_at: null });
};

export const useDeleteRestoreBudgetStep = (
    isStepDeleted: boolean,
): UseMutationResult => {
    const mutationFn = isStepDeleted ? unhideBudgetStep : hideBudetStep;
    return useSnackMutation({
        mutationFn,
        invalidateQueryKey: 'budget',
        showSucessSnackBar: false,
    });
};
