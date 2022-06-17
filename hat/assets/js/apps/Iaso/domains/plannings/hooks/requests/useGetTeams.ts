/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';

type Team = {
    id: number;
    name: string;
};

type Teams = Team[];

const getTeams = (): Promise<Teams> => {
    return getRequest('/api/microplanning/teams/');
};

export const useGetTeams = (): UseQueryResult<
    DropdownOptions<string>,
    Error
> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        select: data => {
            if (!data) return [];
            return data.map(team => {
                return {
                    value: team.id.toString(),
                    label: team.name,
                };
            });
        },
    });
};

export const useGetValidationTeam = (): UseQueryResult<any, Error> => {
    const queryKey: any[] = ['teams', 'validation team'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        select: data => {
            if (!data) return [];
            return data.find(team => team.name === 'Validation team');
        },
    });
};
