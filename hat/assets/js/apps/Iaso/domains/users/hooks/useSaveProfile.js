import { postRequest, patchRequest } from 'Iaso/libs/Api.ts';
import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';

export const useSaveProfile = (showSuccessSnackBar = true) =>
    useSnackMutation({
        mutationFn: body =>
            body.id
                ? patchRequest(`/api/profiles/${body.id}/`, body)
                : postRequest('/api/profiles/', body),
        invalidateQueryKey: ['profiles', 'usersHistoryList', 'team'],
        showSuccessSnackBar,
    });
