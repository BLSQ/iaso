import { useMemo } from 'react';
import { IntlMessage } from 'bluesquare-components';
import { isEmpty } from 'lodash';
import { UseQueryResult } from 'react-query';
import { Team } from 'Iaso/domains/teams/types/team';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';
import MESSAGES from '../messages';

type UseGetProfilesDropdownParams = {
    query?: object;
    additionalFilters?: object;
    team?: Team;
    limit?: number;
    errorMessage?: IntlMessage;
    options?: any;
    triggerWithEmptyQuery?: boolean | (() => boolean);
};

export const useGetProfilesDropdown = ({
    query,
    additionalFilters,
    team,
    limit,
    errorMessage = MESSAGES.error,
    options,
    triggerWithEmptyQuery = true,
}: UseGetProfilesDropdownParams = {}): UseQueryResult<
    DropdownOptions<number>,
    Error
> => {
    const baseParams = useMemo(
        () => ({
            ...(team?.users_details && {
                search: `ids:${team.users_details.map(u => u.id).join(',')}`,
            }),
            ...(limit && { limit }),
            ...(query ?? {}),
        }),
        [team?.users_details, limit, query],
    );

    const params = useMemo(
        () => ({
            ...baseParams,
            ...(additionalFilters ?? {}),
        }),
        [baseParams, additionalFilters],
    );

    const shouldTriggerWithEmptyQuery =
        typeof triggerWithEmptyQuery === 'function'
            ? triggerWithEmptyQuery()
            : triggerWithEmptyQuery;

    return useSnackQuery({
        queryKey: [
            'profiles',
            params ?? {},
            shouldTriggerWithEmptyQuery ? 'triggerWithEmptyQuery' : undefined,
        ].filter(Boolean),
        queryFn: () => {
            if (isEmpty(baseParams) && !shouldTriggerWithEmptyQuery) {
                return Promise.resolve([]);
            }
            return getRequest(
                makeUrlWithParams('/api/profiles/dropdown/', params),
            );
        },

        snackErrorMsg: errorMessage,
        options: {
            ...options,
            ...(limit
                ? {
                      select: data => data?.results,
                  }
                : {}),
        },
    });
};
