import { useEffect, useState } from 'react';
import { UseMutationResult, UseQueryResult, useQueryClient } from 'react-query';
import { getRequest, postRequest } from '../libs/Api';
import { useSnackMutation, useSnackQuery } from '../libs/apiHooks';

const TASK_ENDPOINT = '/api/tasks/';
const TASK_CREATE_ENDPOINT = '/api/tasks/create/';

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
        invalidateQueryKey: ['get-latest-task-run'],
    });
};

const getTasks = (id?: number, endpoint = TASK_ENDPOINT) => {
    const url = id ? `${endpoint}${id}/` : endpoint;
    return getRequest(url);
};

export const useTaskMonitor = ({
    taskId,
    endpoint = TASK_ENDPOINT,
    interval = 1000,
    enabled = false,
}: {
    taskId?: number;
    endpoint?: string;
    interval?: number;
    enabled?: boolean;
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryKey: ['task-monitor', taskId, endpoint],
        queryFn: () => getTasks(taskId, endpoint),
        options: {
            refetchInterval: data => {
                // return false if the task is over, this stops the refetch
                return enabled &&
                    data &&
                    ['RUNNING', 'QUEUED'].includes(data.status)
                    ? interval
                    : false;
            },
            enabled: enabled,
        },
    });
};
