import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest, patchRequest } from 'Iaso/libs/Api';

export const useSaveProfile = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/profiles/${body.id}/`, body)
                : postRequest('/api/profiles/', body),
        undefined,
        undefined,
        ['profiles'],
    );
