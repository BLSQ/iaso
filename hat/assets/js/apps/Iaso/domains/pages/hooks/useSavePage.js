import { useSnackMutation } from '../../../libs/apiHooks';
import { postRequest, putRequest } from '../../../libs/Api';

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
