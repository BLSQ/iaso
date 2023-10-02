import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const deleteGroupedCampaign = async id =>
    deleteRequest(`/api/polio/campaignsgroup/${id}/`);

export const useDeleteGroupedCampaign = (): UseMutationResult => {
    return useSnackMutation(
        id => deleteGroupedCampaign(id),
        undefined,
        undefined,
        ['groupedCampaigns'],
    );
};
