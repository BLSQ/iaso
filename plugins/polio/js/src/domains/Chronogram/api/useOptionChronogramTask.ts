import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { optionsRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { ChronogramTaskMetaData } from '../types';
import { apiBaseUrl } from '../constants';

export const useOptionChronogramTask = (): UseQueryResult<
    ChronogramTaskMetaData,
    Error
> =>
    useSnackQuery({
        queryKey: ['optionChronogramTask'],
        queryFn: () => optionsRequest(`${apiBaseUrl}/tasks/`),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
            select: data => {
                const metadata = data.actions.OPTIONS;
                const mapChoices = choices =>
                    choices.map(choice => ({
                        label: choice.display_name,
                        value: choice.value,
                    }));
                return {
                    period: mapChoices(metadata.period.choices),
                    status: mapChoices(metadata.status.choices),
                };
            },
        },
    });
