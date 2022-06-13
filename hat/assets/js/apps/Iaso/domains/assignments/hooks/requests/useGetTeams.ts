/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { Teams, DropdownTeamsOptions, Team } from '../../types/team';

import { getTeamColor } from '../../constants/teamColors';

const getTeams = (): Promise<Teams> => {
    return getRequest('/api/microplanning/teams/');
};

export const useGetTeams = (): UseQueryResult<
    Array<DropdownTeamsOptions>,
    Error
> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        select: data => {
            if (!data) return [];
            return data.map((team: Team, index: number) => {
                return {
                    value: team.id.toString(),
                    label: team.name,
                    original: team,
                    color: getTeamColor(index),
                };
            });
        },
    });
};
