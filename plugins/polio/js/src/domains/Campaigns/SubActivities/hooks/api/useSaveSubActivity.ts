import { UseMutationResult } from 'react-query';
import {
    postRequest,
    putRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const apiUrl = '/api/polio/campaigns_subactivities/';

const saveActivity = values => {
    const { id, ...body } = values;
    if (id) {
        return putRequest(`${apiUrl}${id}/`, body);
    }
    return postRequest(apiUrl, body);
};

export const useSaveSubActivity = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: saveActivity,
        invalidateQueryKey: ['subActivities'],
        // TODO add success and error messages
    });
};
