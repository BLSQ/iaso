import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';

const deleteOrgUnitType = (id: number) =>
    deleteRequest(`/api/v2/orgunittypes/${id}/`);

type useDeleteArgs = {
    params: any;
    count: number
}

export const useDeleteOrgUnitType = ({params, count}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: [
            'paginated-orgunit-types',
        ],
        baseUrl: baseUrls.orgUnitTypes,
    });

    return useSnackMutation({
        mutationFn: deleteOrgUnitType,
        options:{
            onSuccess,
        }
    });
};
