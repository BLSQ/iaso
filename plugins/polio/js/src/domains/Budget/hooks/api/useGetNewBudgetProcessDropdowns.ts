import { UseQueryResult } from 'react-query';
import { useCallback } from 'react';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { DropdownOptions, OptionsRounds } from '../../types';
import { formatRoundNumber } from '../../utils';

export const useGetNewBudgetProcessDropdowns = (): UseQueryResult<
    DropdownOptions,
    Error
> => {
    const select = useCallback((data: DropdownOptions) => {
        const formattedRounds = data.rounds.map((round: OptionsRounds) => {
            return {
                id: round.id,
                name: formatRoundNumber(round.name),
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
            getRequest('/api/polio/budget/new_budget_process_dropdowns/'),
        options: {
            keepPreviousData: true,
            select,
        },
    });
};
