import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { DropdownOptions, OptionsRounds } from '../../types';
import { formatRoundNumber } from '../../utils';

const filterAvailableRoundsForCreate = (data: DropdownOptions) => {
    const result: DropdownOptions = {
        countries: [],
        campaigns: [],
        rounds: [],
    };
    if (data.rounds !== undefined) {
        const formattedRounds = data.rounds.map((round: OptionsRounds) => {
            return {
                value: round.value,
                label: formatRoundNumber(round.label),
                campaign_id: round.campaign_id,
            };
        });
        result.countries = data.countries;
        result.campaigns = data.campaigns;
        result.rounds = formattedRounds;
    }
    return result;
};

export const useAvailableRoundsForCreate = (): UseQueryResult<
    DropdownOptions,
    Error
> => {
    return useSnackQuery({
        queryKey: ['new_budget_process_dropdowns'],
        queryFn: () =>
            getRequest('/api/polio/budget/available_rounds_for_create/'),
        options: {
            keepPreviousData: true,
            select: data => filterAvailableRoundsForCreate(data),
        },
    });
};

const filterAvailableRoundsForUpdate = (data: OptionsRounds[]) => {
    let result: OptionsRounds[] = [];
    if (Array.isArray(data)) {
        result = data.map((round: OptionsRounds) => {
            return {
                value: round.value,
                label: formatRoundNumber(round.label),
                campaign_id: round.campaign_id,
            };
        });
    }
    return result;
};

export const useAvailableRoundsForUpdate = (
    campaignID: string,
    budgetProcessId: number,
): UseQueryResult<OptionsRounds[], Error> => {
    return useSnackQuery({
        queryKey: ['new_budget_process_dropdowns'],
        queryFn: () =>
            getRequest(
                `/api/polio/budget/available_rounds_for_update/?campaign_id=${campaignID}&budget_process_id=${budgetProcessId}`,
            ),
        options: {
            keepPreviousData: true,
            select: data => filterAvailableRoundsForUpdate(data),
        },
    });
};
