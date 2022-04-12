import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { postRequest, putRequest } from 'Iaso/libs/Api';
import { commaSeparatedIdsToStringArray } from '../../../../../hat/assets/js/apps/Iaso/utils/forms';

export const useSaveCampaign = () => {
    return useSnackMutation(
        body => {
            // TODO remove thsi hack when we get the rela multiselect in polio
            const hackedBody = {
                ...body,
                grouped_campaigns: body.grouped_campaigns
                    ? commaSeparatedIdsToStringArray(body.grouped_campaigns)
                    : [],
            };
            return hackedBody.id
                ? putRequest(
                      `/api/polio/campaigns/${hackedBody.id}/`,
                      hackedBody,
                  )
                : postRequest('/api/polio/campaigns/', hackedBody);
        },
        undefined,
        undefined,
        ['polio', 'campaigns'],
    );
};
