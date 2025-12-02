import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useUrlParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { PerformanceList, PerformanceData } from '../../types';

const getPerformanceDashboard = (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/polio/performance_dashboard/?${queryString}`);
};

export const useGetPerformanceDashboard = (params: any) => {
    const safeParams = useUrlParams(params);
    const apiParams = useApiParams(safeParams);

    return useSnackQuery<PerformanceList>(
        [
            'performance-dashboard', apiParams
        ],
        () => getPerformanceDashboard(apiParams),
        {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 5,
        },
    );
};
