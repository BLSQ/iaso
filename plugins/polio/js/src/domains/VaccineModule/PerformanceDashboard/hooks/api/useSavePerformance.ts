import { useQueryClient } from 'react-query';
import {
    postRequest,
    patchRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PerformanceData } from '../../types';

const savePerformanceDashboard = (data: Partial<PerformanceData>) => {
    if (data.id) {
        // If data has an ID, it means we are updating an existing entry
        return patchRequest(
            `/api/polio/performance_dashboard/${data.id}/`,
            data,
        );
    }
    // Otherwise, we are creating a new entry
    return postRequest('/api/polio/performance_dashboard/', data);
};

export const useSavePerformance = () => {
    const queryClient = useQueryClient(); // Get the query client instance

    return useSnackMutation<any, any, Partial<PerformanceData>>(
        // The mutation function that performs the actual API call
        (data: Partial<PerformanceData>) => savePerformanceDashboard(data),
        // Options for useSnackMutation
        undefined, // No specific success message config here, use default
        undefined, // No specific error message config here, use default
        ['performance-dashboard'], // Query keys to invalidate on success (optional, but good practice)
        {
            onSuccess: () => {
                // Invalidate the 'performance-dashboard' query cache after a successful save.
                // This forces any components using useGetPerformanceDashboard to refetch fresh data.
                queryClient.invalidateQueries(['performance-dashboard']);
            },
        },
    );
};
