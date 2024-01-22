import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest, putRequest } from 'Iaso/libs/Api.ts';
import { commaSeparatedIdsToStringArray } from 'Iaso/utils/forms';

// we need this check because the select box returns the list in string format, but the api retirns an actual array
const formatGroupedCampaigns = groupedCampaigns => {
    if (typeof groupedCampaigns === 'string')
        return commaSeparatedIdsToStringArray(groupedCampaigns);
    return groupedCampaigns ?? [];
};
export const useSaveCampaign = () => {
    return useSnackMutation({
        mutationFn: body => {
            // TODO remove this hack when we get the real multiselect in polio
            const hackedBody = {
                ...body,
                grouped_campaigns: formatGroupedCampaigns(
                    body.grouped_campaigns,
                ),
            };
            return hackedBody.id
                ? putRequest(
                      `/api/polio/campaigns/${hackedBody.id}/`,
                      hackedBody,
                  )
                : postRequest('/api/polio/campaigns/', hackedBody);
        },
        // disable the snackbar here because it would lead to an early re-render of the table
        // that would prevent the modal from closing and add a couple of other glitches
        showSucessSnackBar: false,
        invalidateQueryKeys: [['polio', 'campaigns']],
    });
};
