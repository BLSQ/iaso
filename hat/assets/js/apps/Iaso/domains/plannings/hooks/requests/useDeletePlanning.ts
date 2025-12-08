import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { endpoint } from '../../constants';
import { baseUrls } from '../../../../constants/urls';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';

const deletePlanning = (id: number) => deleteRequest(`${endpoint}${id}`);

type useDeleteArgs = {
    params: any;
    count: number;
}

export const useDeletePlanning = ({params, count}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['planningsList'],
        baseUrl: baseUrls.planning,
    })

    return useSnackMutation({
        mutationFn: deletePlanning,
        options: {
            onSuccess,
        }
    });
};
