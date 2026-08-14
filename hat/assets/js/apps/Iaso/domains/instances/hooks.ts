import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { Instance } from './types/instance';

const postLockInstance = (instance: Instance) =>
    postRequest(`/api/instances/${instance.id}/add_lock/`);

export const usePostLockInstance = () => {
    return useSnackMutation<unknown, unknown, Instance>({
        mutationFn: postLockInstance,
    });
};
