import { UseQueryResult } from 'react-query';
import { Task } from 'Iaso/domains/tasks/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const usePollTask = (
    taskId?: number,
    onSuccess?: (data: Task<any>) => void,
): UseQueryResult<Task<any>, DjangoError> => {
    return useSnackQuery({
        queryKey: ['task', taskId],
        queryFn: () => getRequest(`/api/tasks/${taskId}/`),
        dispatchOnError: false,
        options: {
            enabled: Boolean(taskId),
            refetchInterval: data => {
                // Continue polling if task is still running
                if (data?.status === 'RUNNING') {
                    return 5000; // Poll every 5 seconds
                }
                return false; // Stop polling when task is complete
            },
            refetchIntervalInBackground: true,
            retry: false,
            onSuccess: data => {
                if (data?.status === 'SUCCESS') {
                    onSuccess?.(data);
                }
                return data;
            },
        },
    });
};
