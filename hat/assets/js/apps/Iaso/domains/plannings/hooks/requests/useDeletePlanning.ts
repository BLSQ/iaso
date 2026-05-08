import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { PLANNINGS_API_URL } from '../../constants';

const deletePlanning = (id: number) =>
    deleteRequest(`${PLANNINGS_API_URL}${id}/`);

type useDeleteArgs = {
    params?: any;
    count?: number;
    onSuccessCustomAction?: () => void;
};

export const useDeletePlanning = ({
    params,
    count,
    onSuccessCustomAction,
}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count: count || 0,
        params: params || {},
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['planningsList'],
        baseUrl: baseUrls.planning,
        onSuccessCustomAction,
    });

    return useSnackMutation({
        mutationFn: deletePlanning,
        options: {
            onSuccess,
        },
    });
};
