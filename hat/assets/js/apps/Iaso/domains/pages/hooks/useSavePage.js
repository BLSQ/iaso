import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { postRequest, putRequest } from 'Iaso/libs/Api';

export const useSavePage = () =>
    useSnackMutation(
        body =>
            body.id
                ? putRequest(`/api/pages/${body.id}/`, body)
                : postRequest('/api/pages/', body),
        undefined,
        undefined,
        ['iaso', 'pages'],
    );
