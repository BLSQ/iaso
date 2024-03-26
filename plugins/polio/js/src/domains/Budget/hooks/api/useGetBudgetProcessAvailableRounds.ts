import { UseQueryResult } from 'react-query';
import { useCallback } from 'react';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { DropdownOptions, OptionsRounds } from '../../types';
import { formatRoundNumber } from '../../utils';

export const useAvailableRoundsDependentDropdowns = (): UseQueryResult<
    DropdownOptions,
    Error
> => {
    const select = useCallback((data: DropdownOptions) => {
        const formattedRounds = data.rounds.map((round: OptionsRounds) => {
            return {
                value: round.value,
                label: formatRoundNumber(round.label),
                campaign_id: round.campaign_id,
            };
        });
        return {
            countries: data.countries,
            campaigns: data.campaigns,
            rounds: formattedRounds,
        };
    }, []);

    return useSnackQuery({
        queryKey: ['new_budget_process_dropdowns'],
        queryFn: () =>
            getRequest('/api/polio/budget/available_rounds_dropdowns/'),
        options: {
            keepPreviousData: true,
            select,
        },
    });
};

export const useGetAvailableRoundsForBudgetProcess = (
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
