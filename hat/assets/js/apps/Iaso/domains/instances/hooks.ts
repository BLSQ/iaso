import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

const postLockInstance = instance =>
    postRequest(`/api/instances/${instance.id}/add_lock/`);

export const usePostLockInstance = () => {
    return useSnackMutation({
        mutationFn: postLockInstance,
    });
};
