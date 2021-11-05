import { useSnackMutation } from 'iaso/libs/apiHooks';
import { postRequest, putRequest } from 'iaso/libs/Api';

export const useSaveCampaign = () =>
    useSnackMutation(
        body =>
            body.id
                ? putRequest(`/api/polio/campaigns/${body.id}/`, body)
                : postRequest('/api/polio/campaigns/', body),
        undefined,
        undefined,
        ['polio', 'campaigns'],
    );
