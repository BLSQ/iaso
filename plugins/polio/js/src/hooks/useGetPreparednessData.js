import { useSnackMutation } from 'iaso/libs/apiHooks';
import { postRequest } from 'iaso/libs/Api';

// This retrieve data but since it contact data from an external service this is
// implemented as a post
export const useGetPreparednessData = () => {
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
