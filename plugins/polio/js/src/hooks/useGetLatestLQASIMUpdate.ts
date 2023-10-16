import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { Optional } from '../../../../../hat/assets/js/apps/Iaso/types/utils';

const endpoint = '/api/polio/tasks/refreshlqas/last_run_for_country/';

const getLatestRefresh = (category: string, countryId: Optional<number>) => {
    const url = countryId ? `${endpoint}?country_id=${countryId}` : endpoint;
    if (category === 'lqas' && countryId !== undefined) {
        return getRequest(url);
    }
    return null;
};

export const useGetLatestLQASIMUpdate = (
    category: string,
    countryId: Optional<number>,
): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryKey: ['get-latest-task-run', category, countryId],
        queryFn: () => getLatestRefresh(category, countryId),
        options: {
            select: data => data?.task ?? {},
            refetchInterval: 1000,
            keepPreviousData: true,
            enabled: countryId !== undefined,
        },
    });
};
