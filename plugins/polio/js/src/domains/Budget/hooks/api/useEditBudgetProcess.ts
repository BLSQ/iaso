import { UseMutationResult, UseQueryResult } from 'react-query';
import { useCallback } from 'react';

import {
    getRequest,
    patchRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { OptionsRounds } from '../../types';
import { formatRoundNumber } from '../../utils';

export const useGetAvailableRounds = (
    campaignID: string,
    budgetProcessId: number,
): UseQueryResult<OptionsRounds[], Error> => {
    const select = useCallback((data: OptionsRounds[]) => {
        return data.map((round: OptionsRounds) => {
            return {
                value: round.value,
                label: formatRoundNumber(round.label),
                campaign_id: round.campaign_id,
            };
        });
    }, []);

    return useSnackQuery({
        queryKey: ['new_budget_process_dropdowns'],
        queryFn: () =>
            getRequest(
                `/api/polio/budget/available_rounds/?campaign_id=${campaignID}&budget_process_id=${budgetProcessId}`,
            ),
        options: {
            keepPreviousData: true,
            select,
        },
    });
};

const editBudgetProcess = async (payload: any): Promise<any> => {
    const rounds: string[] = payload.rounds.split(',');
    return patchRequest(`/api/polio/budget/${payload.id}/`, { rounds });
};

export const useEditBudgetProcess = (
    invalidateQueryKey = 'budget',
    onSuccess: () => void = () => undefined,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: editBudgetProcess,
        invalidateQueryKey,
        options: {
            onSuccess,
        },
    });
