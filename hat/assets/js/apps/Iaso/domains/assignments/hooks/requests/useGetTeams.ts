/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';

import { Teams, DropdownTeamsOptions, Team } from '../../types/team';

import { getColor } from '../../constants/colors';

const getTeams = async (ancestor: number): Promise<Teams> => {
    const url = makeUrlWithParams('/api/microplanning/teams/', {
        ancestor: `${ancestor}`,
    });
    return getRequest(url) as Promise<Teams>;
};

export const useGetTeams = (
    ancestor: number | undefined,
): UseQueryResult<Array<DropdownTeamsOptions>, Error> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(ancestor), undefined, {
        enabled: Boolean(ancestor),
        select: data => {
            if (!data) return [];
            return data.map((team: Team, index: number) => {
                return {
                    value: team.id.toString(),
                    label: team.name,
                    original: team,
                    color: getColor(index),
                };
            });
        },
    });
};
