import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const apiUrl = '/api/polio/campaigns_subactivities/';

const deleteActivity = (id: string) => {
    return deleteRequest(`${apiUrl}${id}`);
};

export const useDeleteSubActivity = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deleteActivity,
        invalidateQueryKey: ['subActivities', 'calendar-campaigns'],
        // TODO add success and error messages
    });
};
