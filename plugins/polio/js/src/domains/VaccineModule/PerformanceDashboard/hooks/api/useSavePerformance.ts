import {
    postRequest,
    patchRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PerformanceData } from '../../types';

const savePerformanceDashboard = (data: Partial<PerformanceData>) => {
    if (data.id) {
        return patchRequest(
            `/api/polio/performance_dashboard/${data.id}/`,
            data,
        );
    }
    return postRequest('/api/polio/performance_dashboard/', data);
};

export const useSavePerformance = () => {
    return useSnackMutation({
        mutationFn: (data: Partial<PerformanceData>) =>
            savePerformanceDashboard(data),
        invalidateQueryKey: ['performance-dashboard'],
    });
};
