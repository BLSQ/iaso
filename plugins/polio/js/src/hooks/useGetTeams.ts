import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getTeams = (): Promise<any> => {
    return getRequest('/api/microplanning/teams/');
};

export const useGetTeams = (): UseQueryResult<any, Error> => {
    return useSnackQuery(['allteams'], () => getTeams());
};

export const useGetTeamsDropDown = (): UseQueryResult<any, Error> => {
    return useSnackQuery(['teams'], () => getTeams(), undefined, {
        // staleTime required to avoid infinite loop
        staleTime: Infinity,
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
    const queryKey: any[] = ['teamsList'];
    return useSnackQuery(queryKey, () => getTeams(), undefined, {
        // staleTime required to avoid infinite loop
        staleTime: Infinity,
        select: data => {
            if (!data) return [];
            return data.filter(team =>
                team.name.toLowerCase().includes('approval'),
            );
        },
    });
};

export const useUserHasTeam = (
    userId?: number,
): UseQueryResult<boolean, Error> => {
    return useSnackQuery({
        queryKey: ['getUserTeam', userId],
        queryFn: () => getTeams(),
        options: {
            select: data => {
                if (!data) return false;
                return (
                    data.filter(team => team.users.includes(userId)).length > 0
                );
            },
        },
    });
};
