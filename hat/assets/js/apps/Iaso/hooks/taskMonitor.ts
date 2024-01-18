import { UseMutationResult } from 'react-query';
import { postRequest } from '../libs/Api';
import { useSnackMutation } from '../libs/apiHooks';

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
