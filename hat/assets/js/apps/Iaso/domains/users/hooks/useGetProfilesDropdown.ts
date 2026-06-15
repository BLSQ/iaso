import { useMemo } from 'react';
import { IntlMessage } from 'bluesquare-components';
import { isEmpty } from 'lodash';
import { UseQueryResult } from 'react-query';
import { Team } from 'Iaso/domains/teams/types/team';
import {
    getProfilesDropdownQueryKey,
    ProfilesDropdownParams,
} from 'Iaso/domains/users/utils';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';
import MESSAGES from '../messages';

const PROFILES_DROPDOWN_STALE_TIME = 1000 * 60 * 5;

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
    const teamUserIds = team?.users_details?.map(u => u.id).join(',');

    const params: ProfilesDropdownParams = useMemo(
        () => ({
            ...(teamUserIds && {
                search: `ids:${teamUserIds}`,
            }),
            ...(limit && { limit: `${limit}` }),
            ...(query ?? {}),
            ...(additionalFilters ?? {}),
        }),
        [teamUserIds, limit, query, additionalFilters],
    );

    const shouldTriggerWithEmptyQuery =
        typeof triggerWithEmptyQuery === 'function'
            ? triggerWithEmptyQuery()
            : triggerWithEmptyQuery;

    const hasParams = !isEmpty(params);
    const enabled = hasParams || shouldTriggerWithEmptyQuery;

    return useSnackQuery({
        queryKey: getProfilesDropdownQueryKey(
            params,
            shouldTriggerWithEmptyQuery,
        ),
        queryFn: () => {
            if (!hasParams && !shouldTriggerWithEmptyQuery) {
                return Promise.resolve([]);
            }
            return getRequest(
                makeUrlWithParams('/api/profiles/dropdown/', params),
            );
        },
        snackErrorMsg: errorMessage,
        options: {
            enabled,
            staleTime: PROFILES_DROPDOWN_STALE_TIME,
            cacheTime: PROFILES_DROPDOWN_STALE_TIME * 2,
            refetchOnMount: false,
            ...options,
            ...(limit
                ? {
                      select: data => data?.results,
                  }
                : {}),
        },
    });
};
