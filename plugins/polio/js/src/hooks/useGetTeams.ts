import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getTeams = (): Promise<any> => {
    return getRequest('/api/teams/');
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
