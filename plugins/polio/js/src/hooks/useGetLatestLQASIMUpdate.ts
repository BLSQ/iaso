import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { Optional } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { IMType } from '../domains/LQAS-IM/types';

const lqasEndpoint = '/api/polio/tasks/refreshlqas/last_run_for_country/';
const imHHEndpoint = '/api/polio/tasks/refreshim/hh/last_run_for_country/';
const imOHHEndpoint = '/api/polio/tasks/refreshim/ohh/last_run_for_country/';
const imGlobalEndpoint =
    '/api/polio/tasks/refreshim/hh_ohh/last_run_for_country/';

const getImEndpoint = (imType: IMType | 'imHH'): string => {
    switch (imType) {
        case 'imHH':
        case 'imIHH':
            return imHHEndpoint;
        case 'imOHH':
            return imOHHEndpoint;
        case 'imGlobal':
            return imGlobalEndpoint;
        default:
            return '';
    }
};

const getLatestRefresh = (countryId: Optional<string>, imType?: IMType) => {
    const endpoint = !imType ? lqasEndpoint : getImEndpoint(imType);
    const url = countryId ? `${endpoint}?country_id=${countryId}` : endpoint;
    if (countryId !== undefined) {
        return getRequest(url);
    }
    return null;
};

export const useGetLatestLQASIMUpdate = (
    countryId: Optional<string>,
    imType?: IMType,
): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryKey: ['get-latest-task-run', imType, countryId],
        queryFn: () => getLatestRefresh(countryId, imType),
        options: {
            select: data => data?.task ?? {},
            refetchInterval: 5000,
            keepPreviousData: true,
            enabled: countryId !== undefined,
        },
    });
};
