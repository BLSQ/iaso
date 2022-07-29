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
// implemented as a post. This fetch and parse the Google spreadsheet
export const useFetchPreparedness = () => {
    return useSnackMutation(
        googleSheetURL =>
            postRequest('/api/polio/campaigns/preview_preparedness/', {
                google_sheet_url: googleSheetURL,
            }),
        null,
    );
};

export const useGeneratePreparednessSheet = campaign_id => {
    return useSnackMutation(roundNumber =>
        postRequest(
            `/api/polio/campaigns/${campaign_id}/create_preparedness_sheet/`,
            {
                round_number: roundNumber,
            },
        ),
    );
};

// This retrieve data but since it contact data from an external service this is
// implemented as a post
export const useFetchSurgeData = () => {
    return useSnackMutation(
        body => postRequest('/api/polio/campaigns/preview_surge/', body),
        null,
    );
};
