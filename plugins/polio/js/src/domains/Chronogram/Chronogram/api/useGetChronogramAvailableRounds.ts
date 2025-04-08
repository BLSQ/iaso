import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';
import {
    AvailableRoundsDropdownOptions,
    DropdownOptionsRounds,
} from '../types';

const filterAvailableRoundsForCreate = (
    data: AvailableRoundsDropdownOptions,
) => {
    const result: AvailableRoundsDropdownOptions = {
        countries: [],
        campaigns: [],
        rounds: [],
    };
    if (data.rounds !== undefined) {
        const formattedRounds = data.rounds.map(
            (round: DropdownOptionsRounds) => {
                return {
                    value: round.value,
                    label: `${round.label}`,
                    is_test: round.is_test,
                    campaign_id: round.campaign_id,
                };
            },
        );
        result.countries = data.countries;
        result.campaigns = data.campaigns;
        result.rounds = formattedRounds;
    }
    return result;
};

export const useAvailableRoundsForCreate = (): UseQueryResult<
    AvailableRoundsDropdownOptions,
    Error
> => {
    return useSnackQuery({
        queryKey: ['new_chronogram_dropdowns'],
        queryFn: () => getRequest(`${apiBaseUrl}/available_rounds_for_create/`),
        options: {
            keepPreviousData: true,
            select: data => filterAvailableRoundsForCreate(data),
        },
    });
};
