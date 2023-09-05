/* eslint-disable camelcase */
// @ts-ignore
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { postRequest, getRequest } from 'Iaso/libs/Api';

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

const refreshPreparedness = ({ googleSheetURL, campaignName }) => {
    // launch task to refresh endpoint for preparedness dashboard
    postRequest('/api/tasks/create/refreshpreparedness/', {
        obr_name: campaignName,
    });
    return postRequest('/api/polio/campaigns/preview_preparedness/', {
        google_sheet_url: googleSheetURL,
    });
};

// This retrieve data but since it contact data from an external service this is
// implemented as a post. This fetch and parse the Google spreadsheet
export const useFetchPreparedness = () => {
    return useSnackMutation(refreshPreparedness, null);
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
