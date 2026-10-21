import { UseMutationResult, UseQueryResult } from 'react-query';

import MESSAGES from 'Iaso/domains/tasks/messages';
import { getRequest, patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';

import { Task, TaskLogApiResponse } from '../types';

export const useGetTaskTypes = (): UseQueryResult<
    DropdownOptionsWithOriginal<number>[],
    Error
> => {
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['tasks-types'],
        queryFn: () => getRequest('/api/tasks/types/'),
        options: {
            select: (data: string[]) => {
                return data.map(type => {
                    return {
                        value: type,
                        label: type,
                        original: type,
                    };
                });
            },
        },
    });
};

export const useKillTask = (): UseMutationResult =>
    useSnackMutation(
        (task: Task<any>) => patchRequest(`/api/tasks/${task.id}/`, task),
        MESSAGES.patchTaskSuccess,
        MESSAGES.patchTaskError,
        ['tasks'],
    );

export const useRelaunchTask = (): UseMutationResult =>
    useSnackMutation(
        (task: Task<any>) =>
            patchRequest(`/api/tasks/${task.id}/relaunch/`, task),
        MESSAGES.patchTaskSuccess,
        MESSAGES.patchTaskError,
        ['tasks'],
    );

export const useGetLogs = (
    taskId?: number,
    autoRefresh = false,
): UseQueryResult<TaskLogApiResponse, Error> => {
    return useSnackQuery({
        queryKey: ['tasksLogs', taskId],
        queryFn: () => getRequest(`/api/tasks/${taskId}/logs/`),
        options: {
            retry: false,
            keepPreviousData: true,
            refetchInterval: autoRefresh ? 5000 : false,
            enabled: Boolean(taskId),
        },
    });
};
