import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { optionsRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { ChronogramMetaData, ChronogramTaskMetaData } from '../types';
import { apiBaseUrl } from '../constants';

const mapChoices = choices =>
    choices.map(choice => ({
        label: choice.display_name,
        value: choice.value,
    }));

export const useOptionChronogram = (): UseQueryResult<
    ChronogramMetaData,
    Error
> =>
    useSnackQuery({
        queryKey: ['optionChronogram'],
        queryFn: () => optionsRequest(`${apiBaseUrl}`),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
            select: data => {
                return {
                    campaigns: mapChoices(data.campaigns_filter_choices),
                };
            },
        },
    });

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
                return {
                    period: mapChoices(metadata.period.choices),
                    status: mapChoices(metadata.status.choices),
                };
            },
        },
    });
