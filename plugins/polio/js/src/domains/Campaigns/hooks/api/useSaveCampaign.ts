// @ts-ignore
import { postRequest, putRequest } from 'Iaso/libs/Api.ts';
// @ts-ignore
import { commaSeparatedIdsToStringArray } from 'Iaso/utils/forms';
import { UseMutationResult, useMutation, useQueryClient } from 'react-query';
import { CampaignFormValues } from '../../../../constants/types';
import { dispatch } from '../../../../../../../../hat/assets/js/apps/Iaso/redux/store';
import { enqueueSnackbar } from '../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import MESSAGES from '../../../../constants/messages';

// we need this check because the select box returns the list in string format, but the api retirns an actual array
const formatStringtoArray = value => {
    if (typeof value === 'string') return commaSeparatedIdsToStringArray(value);
    return value ?? [];
};

const subActivityUrl = '/api/polio/campaigns_subactivities/';

const dispatchSuccess = message => {
    dispatch(enqueueSnackbar(succesfullSnackBar(undefined, message)));
};

const dispatchError = (message, error) => {
    dispatch(enqueueSnackbar(errorSnackBar(undefined, message, error)));
};

const saveSubActivity = values => {
    if (!values) return null;
    const { id, ...body } = values;
    if (id) {
        return putRequest(`${subActivityUrl}${id}/`, body);
    }
    return postRequest(subActivityUrl, body);
};

const save = (body: CampaignFormValues) => {
    // @ts-ignore
    const { subactivity, ...campaignBody } = body;
    // TODO remove this hack when we get the real multiselect in polio
    // @ts-ignore
    const hackedBody = campaignBody.grouped_campaigns
        ? {
              ...campaignBody,
              grouped_campaigns: formatStringtoArray(
                  // @ts-ignore
                  campaignBody.grouped_campaigns,
              ),
          }
        : body;

    const saveCampaign = hackedBody.id
        ? () => putRequest(`/api/polio/campaigns/${hackedBody.id}/`, hackedBody)
        : () => postRequest('/api/polio/campaigns/', hackedBody);

    if (!subactivity) {
        return saveCampaign()
            .then(campaign => {
                dispatchSuccess(MESSAGES.campaignSaved);
                return campaign;
            })
            .catch(error => {
                dispatchError(MESSAGES.campaignSaveError, error);
            });
    }

    return saveCampaign()
        .then(campaign => {
            return saveSubActivity(subactivity)
                .then(res => {
                    if (res) {
                        dispatchSuccess(MESSAGES.subActivitySaved);
                    }
                })
                .catch(error => {
                    dispatchError(MESSAGES.subActivitySaveError, error);
                })
                .finally(() => {
                    dispatchSuccess(MESSAGES.campaignSaved);
                    return campaign;
                });
        })
        .catch(error => {
            dispatchError(MESSAGES.campaignSaveError, error);
        });
};

export const useSaveCampaign = (): UseMutationResult<any, any, any> => {
    const queryClient = useQueryClient();
    return useMutation('save-campaigns', save, {
        onSuccess: () => {
            queryClient.invalidateQueries(['campaigns']);
            queryClient.invalidateQueries(['subActivities']);
        },
    });
};
