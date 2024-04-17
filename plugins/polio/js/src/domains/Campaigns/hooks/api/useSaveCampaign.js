import { postRequest, putRequest } from 'Iaso/libs/Api.ts';
import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { commaSeparatedIdsToStringArray } from 'Iaso/utils/forms';

// we need this check because the select box returns the list in string format, but the api retirns an actual array
const formatStringtoArray = value => {
    if (typeof value === 'string') return commaSeparatedIdsToStringArray(value);
    return value ?? [];
};
export const useSaveCampaign = () => {
    return useSnackMutation({
        mutationFn: body => {
            // TODO remove this hack when we get the real multiselect in polio
            const hackedBody = {
                ...body,
                grouped_campaigns: formatStringtoArray(body.grouped_campaigns),
            };
            return hackedBody.id
                ? putRequest(
                      `/api/polio/campaigns/${hackedBody.id}/`,
                      hackedBody,
                  )
                : postRequest('/api/polio/campaigns/', hackedBody);
        },
        invalidateQueryKey: ['campaign'],
    });
};
