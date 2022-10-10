/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import {
    deleteRequest,
    getRequest,
    patchRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getBudgetDetails = (params: any) => {
    const { pageSize, ...otherParams } = params;
    const urlParams = {
        ...otherParams,
        limit: pageSize ?? 10,
    };
    const filteredParams = Object.entries(urlParams).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budgetsteps/?${queryString}`);
};

export const useGetBudgetDetails = params => {
    return useSnackQuery({
        queryFn: () => getBudgetDetails(params),
        queryKey: ['budget', 'details', params],
    });
};

// It's a delete request but UX wise it's acts as a hide feature
const hideBudetStep = (id: number) => {
    return deleteRequest(`/api/polio/budgetsteps/${id}`);
};

const unhideBudgetStep = (id: number) => {
    return patchRequest(`/api/polio/budgetsteps/${id}`, { deleted_at: null });
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
