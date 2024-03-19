import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { DropdownOptions } from '../../types';
import { formatRoundNumber } from '../../utils';

export const useGetNewBudgetProcessDropdowns = (): UseQueryResult<
    DropdownOptions,
    Error
> => {
    return useSnackQuery({
        queryKey: ['new_budget_process_dropdowns'],
        queryFn: () =>
            getRequest('/api/polio/budget/new_budget_process_dropdowns/'),
        options: {
            select: data => {
                if (!data) return [];

                console.log(data);

                // data.rounds.forEach(
                //     round => (round.name = formatRoundNumber(round.name)),
                // );
                return data;
            },
        },
    });
};
