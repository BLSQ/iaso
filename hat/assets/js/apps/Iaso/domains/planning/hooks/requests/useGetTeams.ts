/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { teamsList } from '../../mockTeamsList';

type Team = {
    id: number;
    name: string;
};

type Teams = {
    teams: Team[];
};

export const waitFor = (delay: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, delay));

// TODO replace with proper get request
const getTeams = async (): Promise<Teams> => {
    await waitFor(1500);
    return teamsList;
};

export const useGetTeams = (): UseQueryResult<Teams, Error> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        select: data => {
            if (!data?.teams) return [];
            return data.teams.map(team => {
                return {
                    value: team.id,
                    label: team.name,
                };
            });
        },
    });
};
