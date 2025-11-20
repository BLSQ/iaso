import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { makeUrlWithParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

import { PerformanceList } from '../../types';

const getPerformanceDashboard = (params: any) => {
    const url = makeUrlWithParams('/api/polio/performance_dashboard', params);
    return getRequest(url);
};

export const useGetPerformanceDashboard = (params: any) => {
    return useSnackQuery<PerformanceList>(
        ['performance-dashboard', params],
        () => getPerformanceDashboard(params),
        undefined,
        {
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    );
};
