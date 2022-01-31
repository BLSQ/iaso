import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { postRequest, patchRequest } from 'Iaso/libs/Api';

export const useSave = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entity/${body.id}/`, body)
                : postRequest('/api/entity/', body),
        undefined,
        undefined,
        ['entities'],
    );
