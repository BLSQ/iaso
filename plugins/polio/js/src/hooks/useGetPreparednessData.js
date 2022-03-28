import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';

export const useGetPreparednessData = (campaignId, roundKey) => {
    const url = `/api/polio/campaigns/${campaignId}/preparedness?round=${roundKey}`;
    return useSnackQuery(
        [campaignId, roundKey],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(campaignId),
        },
    );
};

// This retrieve data but since it contact data from an external service this is
// implemented as a post
export const useGetPreparednessRefreshData = () => {
    return useSnackMutation(
        googleSheetURL =>
            postRequest('/api/polio/campaigns/preview_preparedness/', {
                google_sheet_url: googleSheetURL,
            }),
        null,
    );
};

export const useGeneratePreparednessSheet = campaign_id => {
    return useSnackMutation(googleSheetURL =>
        postRequest(
            `/api/polio/campaigns/${campaign_id}/create_preparedness_sheet/`,
            {
                google_sheet_url: googleSheetURL,
            },
        ),
    );
};

// This retrieve data but since it contact data from an external service this is
// implemented as a post
export const useSurgeData = () => {
    return useSnackMutation(
        (body, countryName) =>
            postRequest('/api/polio/campaigns/preview_surge/', body),
        null,
    );
};
