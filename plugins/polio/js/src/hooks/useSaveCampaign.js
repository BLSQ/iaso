import { sendRequest, useSnackMutation } from '../utils/networking';

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
