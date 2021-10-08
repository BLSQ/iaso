import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    postRequest,
    putRequest,
} from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

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
