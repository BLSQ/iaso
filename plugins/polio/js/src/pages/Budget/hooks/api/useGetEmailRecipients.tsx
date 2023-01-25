import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getRecipentTeams = (ids: number[]) => {
    if (ids.length === 0) return [];
    const query = ids.join();
    return getRequest(`/api/microplanning/teams/?id__in=${query}`);
};

export const useGetRecipientTeams = (
    ids: number[],
): UseQueryResult<string[]> => {
    return useSnackQuery({
        queryKey: ['teams', ids],
        queryFn: () => getRecipentTeams(ids),
        options: {
            staleTime: 60000,
            select: data => data.map(team => team.name),
        },
    });
};
