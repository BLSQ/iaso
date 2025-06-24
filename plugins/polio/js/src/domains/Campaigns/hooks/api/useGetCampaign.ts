import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetCampaign = campaignId => {
    return useSnackQuery(
        ['campaign', campaignId],
        () => getRequest(`/api/polio/campaigns/${campaignId}/`),
        undefined,
        {
            enabled: Boolean(campaignId),
            keepPreviousData: true,
        },
    );
};
