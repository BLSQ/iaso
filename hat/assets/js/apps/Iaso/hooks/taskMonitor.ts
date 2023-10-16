import { useEffect, useState } from 'react';
import { UseMutationResult, UseQueryResult, useQueryClient } from 'react-query';
import { getRequest, postRequest } from '../libs/Api';
import { useSnackMutation, useSnackQuery } from '../libs/apiHooks';

const TASK_ENDPOINT = '/api/tasks/';
const TASK_CREATE_ENDPOINT = '/api/tasks/create/';

const getTasks = (id?: number, endpoint = TASK_ENDPOINT) => {
    const url = id ? `${endpoint}${id}` : endpoint;
    return getRequest(url);
};

export const useTaskMonitor = ({
    taskId,
    endpoint = TASK_ENDPOINT,
    interval = 1000,
    invalidateQueries = [],
}: {
    taskId?: number;
    endpoint?: string;
    interval?: number;
    invalidateQueries: any[];
}): UseQueryResult<boolean, any> => {
    const [enabled, setEnabled] = useState<boolean>(true);
    const queryClient = useQueryClient();
    useEffect(() => {
        if (taskId) {
            setEnabled(true);
        }
    }, [taskId]);
    return useSnackQuery({
        queryKey: ['task-monitor', taskId, endpoint],
        queryFn: () => getTasks(taskId, endpoint),
        options: {
            refetchInterval: interval,
            enabled: enabled && Boolean(taskId),
            select: data => {
                // Return a boolean that is true if task is not over
                if (!data) return true;
                // check if task is over
                if (data.status === 'RUNNING' || data.status === 'QUEUED')
                    return true;
                return false;
            },
            onSuccess: data => {
                if (!data) {
                    setEnabled(false);
                    if (invalidateQueries.length > 0) {
                        invalidateQueries.forEach(queryKey =>
                            queryClient.invalidateQueries(queryKey),
                        );
                    }
                }
            },
        },
    });
};

const createTask = async (request, endpoint, key) => {
    let file;
    if (request.file) {
        file = { file: request.file };
    }
    const body = { ...request };
    delete body.file;
    const url = key ? `${endpoint}${key}/` : endpoint;
    return postRequest(url, body, file);
};

export const useCreateTask = ({
    key,
    endpoint = TASK_CREATE_ENDPOINT,
}: {
    key?: string;
    endpoint?: string;
}): UseMutationResult => {
    return useSnackMutation({
        mutationFn: request => createTask(request, endpoint, key),
        showSucessSnackBar: false,
        invalidateQueryKey: ['task-monitor'],
    });
};
