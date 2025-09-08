import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest, patchRequest } from 'Iaso/libs/Api.ts';

export const useSaveProfile = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/trypelim/profiles/${body.id}/`, body)
                : postRequest('/api/trypelim/profiles/', body),
        undefined,
        undefined,
        ['profiles', 'usersHistoryList'],
    );
