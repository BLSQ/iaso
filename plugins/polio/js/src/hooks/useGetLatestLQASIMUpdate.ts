import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

const endpoint = '/api/polio/tasks/refreshlqas/last_run_for_country/';

const getLatestRefresh = (category, countryId) => {
    const url = countryId ? `${endpoint}?country_id=${countryId}` : endpoint;
    if (category === 'lqas') {
        return getRequest(url);
    }
    return null;
};

export const useGetLatestLQASIMUpdate = (category, countryId) => {
    return useSnackQuery({
        queryKey: ['get-latest-task-run', category, countryId],
        queryFn: () => getLatestRefresh(category, countryId),
        options: {
            select: data => data?.task ?? {},
            refetchInterval: 1000,
            keepPreviousData: true,
        },
    });
};
