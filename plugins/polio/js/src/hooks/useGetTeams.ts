/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getTeams = (): Promise<any> => {
    return getRequest('/api/microplanning/teams/');
};

export const useGetTeams = (): UseQueryResult<any, Error> => {
    // @ts-ignore
    return useSnackQuery(['allteams'], () => getTeams());
};

export const useGetTeamsDropDown = (): UseQueryResult<any, Error> => {
    // @ts-ignore
    return useSnackQuery(['teams'], () => getTeams(), undefined, {
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

export const useGetApprovalTeams = (): UseQueryResult<any, Error> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        select: data => {
            if (!data) return [];
            return data.filter(team =>
                team.name.toLowerCase().includes('approval'),
            );
        },
    });
};
