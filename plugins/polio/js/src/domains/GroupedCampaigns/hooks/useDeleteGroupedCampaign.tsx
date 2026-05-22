import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';

const deleteGroupedCampaign = async id =>
    deleteRequest(`/api/polio/campaignsgroup/${id}/`);

type useDeleteArgs = {
    params: any;
    count: number;
}

export const useDeleteGroupedCampaign = ({params, count}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['groupedCampaigns'],
        baseUrl: baseUrls.groupedCampaigns,
    });

    return useSnackMutation({
        mutationFn: id => deleteGroupedCampaign(id),
        options: {
            onSuccess,
        }
    });
};
