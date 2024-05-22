import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { Optional } from '../../../../../hat/assets/js/apps/Iaso/types/utils';

const endpoint = '/api/polio/tasks/refreshlqas/last_run_for_country/';

const getLatestRefresh = (isLqas: boolean, countryId: Optional<string>) => {
    const url = countryId ? `${endpoint}?country_id=${countryId}` : endpoint;
    if (isLqas && countryId !== undefined) {
        return getRequest(url);
    }
    return null;
};

export const useGetLatestLQASIMUpdate = (
    isLqas: boolean,
    countryId: Optional<string>,
): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryKey: ['get-latest-task-run', isLqas, countryId],
        queryFn: () => getLatestRefresh(isLqas, countryId),
        options: {
            select: data => data?.task ?? {},
            refetchInterval: 5000,
            keepPreviousData: true,
            enabled: countryId !== undefined,
        },
    });
};
