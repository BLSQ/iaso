import { useQueryClient } from 'react-query';
import { deleteRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const deletePerformanceDashboard = (id: number) => {
    return deleteRequest(`/api/polio/performance_dashboard/${id}/`);
};

export const useDeletePerformance = () => {
    const queryClient = useQueryClient();
    return useSnackMutation(
        (id: number) => deletePerformanceDashboard(id),
        undefined,
        undefined,
        ['performance-dashboard'], // Invalidate the list query after deletion
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['performance-dashboard']);
            },
        },
    );
};
