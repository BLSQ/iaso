import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';

export const useGetCampaign = campaignId => {
    return useSnackQuery(
        ['polio', 'campaigns', campaignId],
        () => getRequest(`/api/polio/campaigns/${campaignId}`),
        undefined,
        {
            enabled: Boolean(campaignId),
        },
    );
};
