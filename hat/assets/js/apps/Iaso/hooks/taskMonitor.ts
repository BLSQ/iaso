import { useState } from 'react';
import { UseMutationResult, UseQueryResult } from 'react-query';
import { getRequest, postRequest } from '../libs/Api';
import { useSnackMutation, useSnackQuery } from '../libs/apiHooks';

const getTasks = (id?: number) => {
    const url = id ? `/api/tasks/${id}` : '/api/tasks/';
    return getRequest(url);
};

export const useTaskMonitor = (
    taskId?: number,
    interval = 1000,
): UseQueryResult<boolean, any> => {
    const [enabled, setEnabled] = useState<boolean>(true);
    return useSnackQuery({
        queryKey: ['task-monitor', taskId],
        queryFn: () => getTasks(taskId),
        options: {
            refetchInterval: interval,
            enabled,
            select: data => {
                if (!data) return false;
                if (data.status === 'RUNNING' || data.status === 'QUEUED')
                    return false;
                return true;
            },
            onSuccess: data => {
                if (data) {
                    setEnabled(false);
                }
            },
        },
    });
};

const createTask = async (request, key) => {
    let file;
    if (request.file) {
        file = { file: request.file };
    }
    const body = { ...request };
    delete body.file;
    return postRequest(`/api/tasks/create/${key}/`, body, file);
};

export const useCreateTask = (key: string): UseMutationResult => {
    return useSnackMutation({
        mutationFn: request => createTask(request, key),
        showSucessSnackBar: false,
        invalidateQueryKey: ['task-monitor'],
    });
};
