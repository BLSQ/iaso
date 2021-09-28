import { sendRequest } from '../utils/networking';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export const useSaveCampaign = () =>
    useSnackMutation(
        body => {
            const method = body.id ? 'PUT' : 'POST';
            const path = `/api/polio/campaigns/${body.id ? `${body.id}/` : ''}`;
            return sendRequest(method, path, body);
        },
        undefined,
        undefined,
        ['polio', 'campaigns'],
    );
